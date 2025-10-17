
let currentsong = new Audio();
let songs;
let currfolder;
function formatTime(seconds) {
    // Round the seconds to nearest whole number
    if (isNaN(seconds) || seconds < 0) {
        return "00:00"
    }
    const totalSeconds = Math.round(seconds);

    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}
async function getsongs(folder) {
    currfolder = folder
    let a = await fetch(`http://127.0.0.1:3000/${folder}/`)
    let response = await a.text();

    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }

    }

    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songul.innerHTML = ""
    for (const song of songs) {
        songul.innerHTML = songul.innerHTML + `  <li> <img src="img/music.svg" class="invert" alt="">
                    <div class="info"><div>${song.replaceAll("%20", " ")}</div>
                <div>song artist</div></div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img src="img/play.svg" alt="" class="invert">
                </div>
             </li> `
    }
    // attach an event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            // console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playmusic(e.querySelector(".info").firstElementChild.innerHTML.trim())

        })

    })

}

const playmusic = (track, pause = false) => {
    if (!pause) {
        currentsong.play()
        play.src = "img/pause.svg"


    }
    currentsong.src = `/${currfolder}/` + track
    // currentsong.play()

    play.src = "img/play.svg"
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00/00"

}
async function displayalbums() {
    let a = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await a.text();

    // make a dummy element to parse HTML
    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");
    let cardcontainer = document.querySelector(".cardcontainer");

    for (let e of anchors) {
        let href = e.getAttribute("href");

        // ✅ skip parent directory links or hidden files
        if (!href || href === "../" || href.includes(".DS_Store")) continue;

        // ✅ extract the folder name correctly
        // Example: href = "/songs/ncs/" → folder = "ncs"
        let parts = href.split("/");
        let folder = parts.filter(p => p && p !== "songs").pop();

        // ✅ fetch the info.json file inside that folder
        let infoUrl = `http://127.0.0.1:3000/songs/${folder}/info.json`;
        let infoResponse = await fetch(infoUrl);

        if (!infoResponse.ok) {
            console.warn("Skipping folder:", folder);
            continue;
        }

        let info = await infoResponse.json();

        // ✅ create the card
        cardcontainer.innerHTML += `
            <div class="card" data-folder="${folder}">
                <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="#1fd564" />
                        <polygon points="40,30 40,70 70,50" fill="#000" />
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpeg" alt="">
                <h2>${info.title}</h2>
                <p>${info.description}</p>
            </div>`;
    }

    // ✅ attach click event to cards
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            await getsongs(`songs/${card.dataset.folder}`);
        });
    });
}


async function main() {

    
    // get the list of all the songs
    await getsongs(`songs/ncs`)
    playmusic(songs[0], true)


    // display all the albums on the page
    displayalbums()



    // attach an event to play the song
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play()
            play.src = "img/pause.svg"
        } else {
            currentsong.pause()
            play.src = "img/play.svg"
        }
    })

    // listen for time update event
    currentsong.addEventListener("timeupdate", () => {
        // console.log(currentsong.currentTime,currentsong.duration)
        document.querySelector(".songtime").innerHTML = `${formatTime(currentsong.currentTime)}/${formatTime(currentsong.duration)}`
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%"

    })
    // add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        console.log(e.target.getBoundingClientRect().width, e.offsetX)
        document.querySelector(".circle").style.left = percent + "%"
        currentsong.currentTime = ((currentsong.duration) * percent) / 100
    })


    // add an event listener to hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"


    })
    // add an event listener to cross 
    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%"
    })
    // add an event listener to previous
    previous.addEventListener("click", () => {
        console.log("pre")

        let idx = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if ((idx - 1) >= 0) {
            playmusic(songs[idx - 1])
        }
    })

    // add an event listener to next
    next.addEventListener("click", () => {
        currentsong.pause()
        console.log("next")
        let idx = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if ((idx + 1) < songs.length) {
            playmusic(songs[idx + 1])
        }

    })
    // add an event listener to volume
    document.querySelector(".volume").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100
    })
    // load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            await getsongs(`songs/${item.currentTarget.dataset.folder}`)

        })
    })
    // add an event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click",e=>{
       
        if (e.target.src.includes("img/volume.svg") ){
            e.target.src = e.target.src.replace("img/volume.svg","img/mute.svg")
            currentsong.volume = "0";
            document.querySelector(".volume").getElementsByTagName("input")[0].value = 0;

        }
        else{
            e.target.src = e.target.src.replace("img/mute.svg","img/volume.svg")
            currentsong.volume = "0.1"
            document.querySelector(".volume").getElementsByTagName("input")[0].value = 10;
        }

    })



}


main()



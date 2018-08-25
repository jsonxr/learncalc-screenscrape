const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const fetch = require('node-fetch');


async function download(filename, url) {
  if (fs.existsSync('tmp.mp4')){
    fs.unlinkSync('tmp.mp4');
  }
  return fetch(url)
  	.then(res => {
  		return new Promise((resolve, reject) => {
  			const dest = fs.createWriteStream('tmp.mp4');
  			res.body.pipe(dest);
  			res.body.on('error', err => {
          console.error(err);
  				reject(err);
  			});
  			dest.on('finish', () => {
          fs.renameSync('tmp.mp4', filename);
  				resolve();
  			});
  			dest.on('error', err => {
          console.error(err);
  				reject(err);
  			});
  		});
  	});
}

function getDownloadUrlFromElements(elements, match) {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].next.data.indexOf(match) >= 0) {
      return elements[i].attribs.href;
    }
  }
}

async function getVideoMp4(videoUrl) {
  const params = new URLSearchParams();
  params.append('url', videoUrl);
  const options = {
    method: "POST",
    headers: {
      "Referer": "http://savevideo.me/"
    },
    body: params
  };

  const res = await fetch('http://savevideo.me/get/', options);
  const body = await res.text();
  const $ = cheerio.load(body);

  // First try to get Mobile quality
  const elements = $('div.download_links a');
  const qualities = [
    'SD Quality',
    'MP4 format – Mobile',
    'Medium Quality'
    //'Low Quality'
  ]

  let url = null;
  for (let i = 0; i < qualities.length; i++) {
    url = getDownloadUrlFromElements(elements, qualities[i]);
    if (url) return url;
  }

  // Crap, now what...
  console.log(elements);
  process.exit(1);
}

async function main() {
  const chapters = JSON.parse(fs.readFileSync('calculus.json', 'utf8'));
  const downloads = [];

  // Make data dir
  const dataDir = path.resolve('data');
  if (!fs.existsSync(path.resolve(dataDir))){
      fs.mkdirSync(dataDir);
  }
  
  chapters.forEach(chapter => {
    const chapterDir = path.resolve(dataDir, chapter.name);
    if (!fs.existsSync(chapterDir)){
        fs.mkdirSync(chapterDir);
    }

    chapter.sections.forEach(section => {
      const sectionDir = path.resolve(chapterDir, section.name);
      if (!fs.existsSync(sectionDir)){
          fs.mkdirSync(sectionDir);
      }

      section.videos.forEach( (video, index) => {
        video.savePath = path.resolve(sectionDir, `${index + 1} - ${video.name}.mp4`);
        if (! fs.existsSync(video.savePath)) {
          downloads.push(video);
        } else {
          console.log(video.savePath, ' done.');
        }
      })
    })
  });

  console.log(`${downloads.length} downloads...`)
  for (let i = 0; i < downloads.length; i++) {
    const video = downloads[i];
    const downloadUrl = await getVideoMp4(video.videoUrl);
    await download(video.savePath, downloadUrl);
    console.log(`${i+1}/${downloads.length} - ${video.savePath} done.`);
  }
  
}

main();
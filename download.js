const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const fetch = require('node-fetch');


async function download(filename, url) {
  if (fs.existsSync('tmp.mp4')){
    fs.unlink('tmp.mp4');
  }
  return fetch(url)
  	.then(res => {
  		return new Promise((resolve, reject) => {
  			const dest = fs.createWriteStream('tmp.mp4');
  			res.body.pipe(dest);
  			res.body.on('error', err => {
  				reject(err);
  			});
  			dest.on('finish', () => {
          console.log(filename, ' done.');
          fs.renameSync('tmp.mp4', filename);
  				resolve();
  			});
  			dest.on('error', err => {
  				reject(err);
  			});
  		});
  	});
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

  const elements = $('div.download_links a');
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].next.data === ' (MP4 format – Mobile)') {
      return elements[i].attribs.href;
    }
  }

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

      section.videos.forEach(video => {
        video.savePath = path.resolve(sectionDir, `${video.name}.mp4`);
        if (! fs.existsSync(video.savePath)) {
          downloads.push(video);
        } else {
          console.log(video.savePath, ' done.');
        }
      })
    })
  });

  for (let i = 0; i < downloads.length; i++) {
    const video = downloads[i];
    const downloadUrl = await getVideoMp4(video.videoUrl);
    await download(video.savePath, downloadUrl);
  }
  
}

main();
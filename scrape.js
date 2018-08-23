const fs = require('fs');
const cheerio = require('cheerio');
const fetch = require('node-fetch');


const URL = 'http://www.larsoncalculus.com/calc10/content/proof-videos/';

async function download(filename, url) {
  return fetch(url)
  	.then(res => {
  		return new Promise((resolve, reject) => {
  			const dest = fs.createWriteStream(filename);
  			res.body.pipe(dest);
  			res.body.on('error', err => {
  				reject(err);
  			});
  			dest.on('finish', () => {
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

async function getVideoFromElement(ele) {
  const video = {
    name: ele.children[0].data,
    url: ele.attribs.rel
  }

  console.log(`    - ${video.name}`);

  const res = await fetch(video.url);
  const body = await res.text();
  const $ = cheerio.load(body);

  const element = $('#moog');
  video.videoUrl = element[0].attribs.src;

  return video;
}

async function getSectionFromElement(ele) {
  const section = {
    name: ele.children[0].data,
    url: ele.attribs.rel,
    videos: []
  }

  console.log(`  - ${section.name}:`);

  const res = await fetch(section.url);
  const body = await res.text();
  const $ = cheerio.load(body);

  const elements = $('#exerciseId').find('option');
  for (let i = 0; i < elements.length; i++) {
    const ele = elements[i];
    if (ele.attribs && ele.attribs.rel) {
      const video = await getVideoFromElement(ele);
      section.videos.push(video);
    }
  }

  return section;
}

async function getChapterFromElement(ele) {
  const chapter = {
    name: ele.children[0].data,
    url: ele.attribs.rel,
    sections: []
  }

  console.log(`${chapter.name}:`);
  // Scrape the chapter html
  const res = await fetch(chapter.url);
  const body = await res.text();
  const $ = cheerio.load(body);

  const elements = $('#sectionId').find('option');
  for (let i = 0; i < elements.length; i++) {
    const ele = elements[i];
    if (ele.attribs && ele.attribs.rel) {
      const section = await getSectionFromElement(ele);
      chapter.sections.push(section);
    }
  }

  return chapter;
}

async function getChapters() {
  const res = await fetch(URL);
  const body = await res.text();

  const $ = cheerio.load(body);
  const chapters = [];
  const elements = $('#chapterId').find('option');
  for (let i = 0; i < elements.length; i++) {
    const ele = elements[i];
    if (ele.attribs && ele.attribs.rel) {
      const chapter = await getChapterFromElement(ele);
      chapters.push(chapter);
    }
  }

  return chapters
}

async function getSections() {
  
}

async function main() {
  const chapters = await getChapters();
  fs.writeFileSync('calculus.json', JSON.stringify(chapters), 'utf8');
  // video.downloadUrl = await getVideoMp4(video.videoUrl);
  // await download('/Users/rowlanj/jsonxr/learncalc/video.mp4', video.downloadUrl);
  
  
  console.log(chapters);
}

main();
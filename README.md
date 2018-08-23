# learncalc-screenscrape

# 1) Scrape website

This creates calculus.json file with all the chapters/sections/videos available.

    node scrape.js


# 2) Download the videos

This uses the calculus.json file created by a scrape and downloads each file from vimeo. It starts where it left off. It creates a data directory and downloads all videos by chapter and section.

    node download.js



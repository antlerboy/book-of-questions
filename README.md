# The 99 Essential Business Questions

A microsite for the book by Gia Campari, David Glassman, Michael Jeans, Patrick McHugh, David Peregrine-Jones, David Shannon, and Benjamin Taylor. Cover design by Natasa Sears.

The questions are the main way into the site. Each has its own link, commentary, possible insights, and connections. Readers can search, browse the 47 situations, follow the ten dimensions from the development manuscripts, save a selection in their browser, and print it.

The site also contains the book’s opening sections and recovered companion writing, with author and source credits. The original cover supplies the colours and question-mark motif.

## Source text

The main source is the 360-page revised print layout dated 23 February 2017, recovered from the publisher’s correspondence. The accompanying message confirms it was being uploaded to the printers. The downloadable reading copy retains every page and crops only to the source’s existing print trim boxes, removing production marks. It includes the illustrations, diagrams, and author biographies.

The source search also recovered the 363-page August 2016 publication manuscript, an October 2016 list of all 99 questions, earlier development manuscripts, and companion writing. The later print layout takes precedence in the question browser.

The ten dimensions come from the July 2014 manuscript. All 99 question numbers were checked against the wording in the 2016 manuscript; the numbers did not change. Three prompts changed wording or amount. These dimensions are an additional index and retain their development status. They do not replace the situation associations in the publication manuscript.

See [SOURCES.md](SOURCES.md) for the editorial record. Private correspondence, access links, contact details, and original attachments are excluded from the repository.

## Run locally

Requires Node.js 24 or later. No dependencies are needed.

```
npm start
```

Open http://127.0.0.1:4173 in a browser. Run `npm run check` to verify the data and assets. The static site is in `dist/`.

## Publication

GitHub Actions publishes `dist/` to GitHub Pages after each push to `main`, following the data checks. The complete standalone website is served at https://antlerboy.github.io/book-of-questions/; it does not depend on the ChatGPT Sites copy.

## Crawler and indexing controls

The HTML asks compliant search engines not to index, follow links, archive, show snippets, or index images. This is a public website, not access-controlled content. GitHub Pages does not provide custom response headers or server-side bot blocking for this project. A robots.txt file only takes effect at https://antlerboy.github.io/robots.txt, not inside /book-of-questions/; root hosting for that policy is pending approval.

These voluntary controls cannot prevent non-compliant scraping or guarantee exclusion from AI training, and cannot recall existing copies. The public GitHub repository, its raw files, API endpoints and clones remain independently accessible. Website robots rules do not protect that source.

## Rights

Book and companion text © their respective authors. Cover design © Natasa Sears. Published book: Filament Publishing, 2016. No open licence for the book, companion writing, or cover is granted by this repository.

# The 99 Essential Business Questions

A microsite for the book by Gia Campari, David Glassman, Michael Jeans, Patrick McHugh, David Peregrine-Jones, David Shannon, and Benjamin Taylor. Cover design by Natasa Sears.

The questions are the main way into the site. Each has its own link, commentary, possible insights, and connections. Readers can search, browse the 47 situations, follow the ten dimensions from the development manuscripts, save a selection in their browser, and print it.

The site also contains the book’s opening sections and recovered companion writing, with author and source credits. The original cover supplies the colours and question-mark motif.

## Source text

The complete book source recovered for this edition is the 363-page August 2016 publication manuscript. It is labelled ‘Draft for final publication’. The copies in the authors’ file archive and the 4 August email circulation are byte-identical. Later revision links lead to an inactive service, so this edition has not been collated against the final printed book.

The ten dimensions come from the July 2014 manuscript. All 99 question numbers were checked against the wording in the 2016 manuscript; the numbers did not change. Three prompts changed wording or amount. These dimensions are an additional index and retain their development status. They do not replace the situation associations in the publication manuscript.

See [SOURCES.md](SOURCES.md) for the editorial record. Private correspondence, access links, contact details, and original attachments are excluded from the repository.

## Run locally

Requires Node.js 24 or later. No dependencies are needed.

```
npm start
```

Open http://127.0.0.1:4173 in a browser. Run `npm run check` to verify the data and assets. The static site is in `dist/`.

## Publication

GitHub Actions publishes `dist/` to GitHub Pages after each push to `main`, following the data checks. The same source can be deployed as a static site through the Sites manifest in `.openai/hosting.json`.

## Rights

Book and companion text © their respective authors. Cover design © Natasa Sears. Published book: Filament Publishing, 2016. No open licence for the book, companion writing, or cover is granted by this repository.

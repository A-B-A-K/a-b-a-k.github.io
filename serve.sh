#!/bin/bash
# Live preview: rebuilds on every save, auto-refreshes the browser.
# Usage: ./serve.sh   then edit markdown and just save.
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"
cd "$(dirname "$0")"
jekyll serve --livereload --open-url

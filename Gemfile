source "https://rubygems.org"

if Gem::Platform.local.os == 'mingw' # Windows
  gem "jekyll"
else
  gem "jekyll-v4-github-pages", group: :jekyll_plugins
end

gem 'jekyll-include-cache', group: :jekyll_plugins
gem "jekyll-feed" , group: :jekyll_plugins
gem "jekyll-seo-tag", group: :jekyll_plugins
gem "jekyll-remote-theme", group: :jekyll_plugins

# If you want to use GitHub Pages, remove the "gem "jekyll"" above and
# uncomment the line below. To upgrade, run `bundle update github-pages`.
# gem "github-pages", group: :jekyll_plugins


# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :x64_mingw do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
  gem "wdm", "~> 0.1.1"
end

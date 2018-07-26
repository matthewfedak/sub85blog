# sub85blog

> This is my personal web dev blog.

## Live Version

View the live working version [here](http://blog.sub85.com).

## About

This is basically your average Jekyll install with some html, markdown and Sass hackery.

I added some grunt tasks to save the git commit revision number so I can link to each revision on Github from the site footer and to minify the generated CSS.

I deploy it to AWS S3 and handle AWS Cloudfront using the awesome [s3_website](https://github.com/laurilehmijoki/s3_website) gem.

## Development Environment

To start development just launch Jekyll from the command line.

     cd {project_root}
     cd site
     bundle exec jekyll serve

## Saving Changes

Commit the changes in GIT and run the gulp tasks to save the git revision hash and minimise the CSS.

    git commit -a
    cd ../
    grunt default
    grunt saveRevision
    cd site
    jekyll build

## Deploying the changes

    git push origin master
    s3_site_push


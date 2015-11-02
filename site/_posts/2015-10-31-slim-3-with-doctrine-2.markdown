---
layout:         post
title:          "Slim 3 with Doctrine 2"
permalink:      slim-3-with-doctrine-2.html
date:           2015-10-31 13:00:03 +0000
comments:       true
---

I have recently started looking at using a PHP microframework to build a simple REST API for an app I'm working on. I was looking for something well supported/documented which would be easy to integrate with [Doctrine 2](https://github.com/doctrine/doctrine2). I'd heard good things about Slim 2 so thought I would check out the new version and maybe write a bit about it.

## TL;DR

To jump straight to my final code you can checkout the example [here](https://github.com/matthewfedak/slim-3-doctrine-2).

## Installation

[Akrabat](https://github.com/akrabat) has already created a [Slim 3 Skeleton App](https://github.com/akrabat/slim3-skeleton) so I decided to use that as my starting point. As a bonus it comes with Twig and Monolog setup and ready to go too. Once you have created a new project using the skeleton app you can install Doctrine 2.

{% highlight shell %}
composer require doctrine/orm
{% endhighlight %}

That will install doctrine 2 and its dependencies.

## Configuration

Inside the app/settings.php file *append* your Doctrine 2 configuration and adjust the connection details to your own settings.

*app/settings.php*
{% highlight php %}
<?php
'doctrine' => [
    'meta' => [
        'entity_path' => [
            'app/src/Entity'
        ],
        'auto_generate_proxies' => true,
        'proxy_dir' =>  __DIR__.'/../cache/proxies',
        'cache' => null,
    ],
    'connection' => [
        'driver'   => 'pdo_mysql',
        'host'     => 'localhost',
        'dbname'   => 'your-db',
        'user'     => 'your-user-name',
        'password' => 'your-password',
    ]
]

{% endhighlight %}

## Command Line Tools

Doctrine 2 has comes with various command line tools that are quite helpful during development. To use these we create a cli-config.php file which will register the EntityManager with the console. This file should live in the root directory of our app but as of Doctrine 2.4 it can be in a sub directory called **config**. The content of my config file is below.

*config/cli-config.php*
{% highlight php %}
<?php
use Doctrine\ORM\Tools\Console\ConsoleRunner;

require 'vendor/autoload.php';

$settings = include 'app/settings.php';
$settings = $settings['settings']['doctrine'];

$config = \Doctrine\ORM\Tools\Setup::createAnnotationMetadataConfiguration(
    $settings['meta']['entity_path'],
    $settings['meta']['auto_generate_proxies'],
    $settings['meta']['proxy_dir'],
    $settings['meta']['cache'],
    false
);

$em = \Doctrine\ORM\EntityManager::create($settings['connection'], $config);

return ConsoleRunner::createHelperSet($em);

{% endhighlight %}

You can now see what tools are available by running this command.

{% highlight shell %}
php vendor/bin/doctrine
{% endhighlight %}

Two commands I use a lot during development are

{% highlight shell %}
php vendor/bin/doctrine orm:schema-tool:create
{% endhighlight %}

and

{% highlight shell %}
php vendor/bin/doctrine orm:schema-tool:update
{% endhighlight %}

These tools are only really for development use though and should not be run on a live production server for obvious reasons. I ran the **create** command to generate the necessary tables based on my entities in the entity path. For the purpose of this demo I just have the one below.

*app/src/Entity/Photo.php*

{% highlight php %}
<?php
namespace App\Entity;

use App\Entity;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="photos", uniqueConstraints={@ORM\UniqueConstraint(name="photo_slug", columns={"slug"})}))
 */
class Photo
{
    /**
     * @ORM\Id
     * @ORM\Column(name="id", type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @ORM\Column(type="string", length=64)
     */
    protected $title;

    /**
     * @ORM\Column(type="string", length=150)
     */
    protected $image;

    /**
     * @ORM\Column(type="string", length=100)
     */
    protected $slug;

    /**
     * Get array copy of object
     *
     * @return array
     */
    public function getArrayCopy()
    {
        return get_object_vars($this);
    }

    /**
     * Get photo id
     *
     * @ORM\return integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Get photo title
     *
     * @ORM\return string
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * Get photo slug
     *
     * @ORM\return string
     */
    public function getSlug()
    {
        return $this->slug;
    }

    /**
     * Get photo image
     *
     * @ORM\return string
     */
    public function getImage()
    {
        return $this->image;
    }
}
{% endhighlight %}

If you are wondering why I specified a character length on my columns it's because I am using MySQL.

*I'll leave it to you to add some dummy records into the table :)*

## Integration
Now that we have Doctrine 2 configured and access to the command line tools we can start to integrate it to our app. The first step is to setup a service container for Doctrine 2 EntityManager in the app/dependencies.php file.

*app/dependencies.php*
{% highlight php %}
<?php
...
// Doctrine
$container['em'] = function ($c) {
    $settings = $c->get('settings');
    $config = \Doctrine\ORM\Tools\Setup::createAnnotationMetadataConfiguration(
        $settings['doctrine']['meta']['entity_path'],
        $settings['doctrine']['meta']['auto_generate_proxies'],
        $settings['doctrine']['meta']['proxy_dir'],
        $settings['doctrine']['meta']['cache'],
        false
    );
    return \Doctrine\ORM\EntityManager::create($settings['doctrine']['connection'], $config);
};

{% endhighlight %}

Slim 3 ships by default with a DI container that extends [Pimple](http://pimple.sensiolabs.org/) which I think is fine for the basic needs on my project. However, I have read over the last few months [Shameer C](http://blog.shameerc.com/2015/09/slim-3-replacing-pimple-with-auradi), [Julian Gut](http://juliangut.com/blog/slim-php-di) and [Akrabat](http://akrabat.com/replacing-pimple-in-a-slim-3-application/) have been eager to replace this with their own choice of DI container. You should read about why in the links above. Make your own choice :)

### Establish some routes

My basic API needed to do two things intially - return a list of photo resources and a single photo resource based on a [slug](https://en.wikipedia.org/wiki/Semantic_URL).

*app/routes.php*
{% highlight php %}
<?php
// Routes
$app->get('/api/photos', 'App\Action\PhotoAction:fetch');
$app->get('/api/photos/{slug}', 'App\Action\PhotoAction:fetchOne');
{% endhighlight %}

### Am I done yet?

Well very nearly. At this point I could just have injected the EntityManager direct into my controller similar to how Twig and Monolog are in the skeleton app examples...

*app/dependencies.php*
{% highlight php %}
<?php
...
$container['App\Action\PhotoAction'] = function ($c) {
    return new App\Action\PhotoAction($c->get('em'));
};
{% endhighlight %}

...and then requested photos directly from inside the controller.

*app/src/Action/PhotoAction.php*

{% highlight php %}
<?php
namespace App\Action;

use Doctrine\ORM\EntityManager;

final class PhotoAction
{
    private $em;

    public function __construct(EntityManager $em)
    {
        $this->em = $em;
    }

    public function fetch($request, $response, $args)
    {
        $photos = $this->em->getRepository('App\Entity\Photo')->findAll();
        $photos = array_map(
            function ($photo) {
                return $photo->getArrayCopy();
            },
            $photos
        );
        return $response->withJSON($photos);
    }

    public function fetchOne($request, $response, $args)
    {
        $photo = $this->em->getRepository('App\Entity\Photo')->findBy(array('slug' => $args['slug']));
        if ($photo) {
            return $response->withJSON($photo->getArrayCopy());
        }
        return $response->withStatus(404, 'No photo found with slug '.$args['slug']);
    }
}
{% endhighlight %}

Although this works fine, I and many others would generally advise against this approach.

### Resource Orientated

It is not good practice to fetch data through accessing the EntityManager directly in a controller. Controllers should be skinny and that type of application logic should be called through services. Since I am developing a REST API I abstracted this code out into separate resource classes. After all the nature of a REST architecture is that everything.

I took inspiration from [A.Sharif](http://busypeoples.github.io/post/slim-doctrine/) who follows this approach in his post on integrating Doctrine 2 and Slim version 2. After having already written this post I then came across the [Slim REST API](https://github.com/jeroenweustink/slim-rest-api) (Slim 2) which goes one step further and abstracts out the relevant code to interact with EntityManager into a related service class which removes the dependency on EntityManager from the resource class.

To save time injecting the EntityManager into each resource I make I made an abstract resource class app/AbstractResource.php with the following contents. Each resource I make from now on can extend this class.

*app/src/AbstractResource.php*
{% highlight php %}
<?php
namespace App;

use Doctrine\ORM\EntityManager;

abstract class AbstractResource
{
    /**
     * @var \Doctrine\ORM\EntityManager
     */
    protected $entityManager = null;

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }
}
{% endhighlight %}

Below is my resource class for photo which extends the abstract resource.

*app/src/Resource/PhotoResource.php*
{% highlight php %}
<?php

namespace App\Resource;

use App\AbstractResource;

/**
 * Class Resource
 * @package App
 */
class PhotoResource extends AbstractResource
{
    /**
     * @param string|null $slug
     *
     * @return array
     */
    public function get($slug = null)
    {
        if ($slug === null) {
            $photos = $this->entityManager->getRepository('App\Entity\Photo')->findAll();
            $photos = array_map(
                function ($photo) {
                    return $photo->getArrayCopy();
                },
                $photos
            );

            return $photos;
        } else {
            $photo = $this->entityManager->getRepository('App\Entity\Photo')->findOneBy(
                array('slug' => $slug)
            );
            if ($photo) {
                return $photo->getArrayCopy();
            }
        }

        return false;
    }
}
{% endhighlight %}

### Skinny controller

Below is the controller I have to access photos. All it does it interact with the resource to get data and return a JSON response.

*app/src/Action/PhotoAction.php*
{% highlight php %}
<?php
namespace App\Action;

use App\Resource\PhotoResource;

final class PhotoAction
{
    private $photoResource;

    public function __construct(PhotoResource $photoResource)
    {
        $this->photoResource = $photoResource;
    }

    public function fetch($request, $response, $args)
    {
        $photos = $this->photoResource->get();
        return $response->withJSON($photos);
    }

    public function fetchOne($request, $response, $args)
    {
        $photo = $this->photoResource->get($args['slug']);
        if ($photo) {
            return $response->withJSON($photo);
        }
        return $response->withStatus(404, 'No photo found with that slug.');
    }
}
{% endhighlight %}

Given these changes I now update my action factory for the Photo controller in the dependencies like so.

*app/dependencies.php*
{% highlight php %}
<?php
...
$container['App\Action\PhotoAction'] = function ($c) {
    $photoResource = new \App\Resource\PhotoResource($c->get('em'));
    return new App\Action\PhotoAction($photoResource);
};
{% endhighlight %}

## Now I'm done

Well like most good developer blog posts I've finished before actually getting started. You can view my example [here](https://github.com/matthewfedak/slim-3-doctrine-2). It's up to you now to go off and carry on building your lightweight Slim 3 app using Doctrine 2. I'm off to pick some fresh tea leaves.

{% if page.comments %}

## Comments

{% include disqus.html %}

{% endif %}

## Sources

* [SlimPHP and Doctrine](https://jcowie.co.uk/articles/Slimphp-Doctrine/)
* [Combining Slim with Doctrine 2](http://busypeoples.github.io/post/slim-doctrine/)
* [Slim REST API](https://github.com/jeroenweustink/slim-rest-api)
* [Setting up the Commandline Tool](http://doctrine-orm.readthedocs.org/projects/doctrine-orm/en/latest/reference/configuration.html#setting-up-the-commandline-tool)
* [Replacing Pimple in Slim 3](http://akrabat.com/replacing-pimple-in-a-slim-3-application/)
* [Change Slim 3 Dependency Injection Container](http://juliangut.com/blog/slim-php-di)
* [Slim 3 Replacing Pimple with Auradi](http://blog.shameerc.com/2015/09/slim-3-replacing-pimple-with-auradi)
* [Pimple](http://pimple.sensiolabs.org/)


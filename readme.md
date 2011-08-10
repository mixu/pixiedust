# Pixie dust.js

Sprinkle this over your REST API definition to generate a chainable Node REST API client.

# What's the point?

Pixie dust creates a lazy, chainable API client from a very simple API definition. All you need to do is describe the URLs and optional search parameters involved.

- Laziness. The API is lazy, so it will only perform reads when you pass it a callback.
- Chainable. You can chain multiple search conditions and fetch multiple records without manually coordinating everything.
- Includes oAuth v2 and HTTP basic auth support.
- Sorting and filtering. Adds the ability to sort and filter records on the client side.
- Pagination. If your API supports pagination, the client can specify the number of records and page to fetch.

# Example APIs

Example definitions are included for the following APIs:

- Zendesk
- Github

# Creating an API client from a definition

All you need to do is this (sample from Zendesk's API client):

    Zendesk = {}
    // Configure your API client for each resource
    Zendesk.users = Collection.initialize('user', {
        me: {
          url: '/users/current.json'
        },
        create: {   
          url: '/users.json'
        },
        read: {   
          url: '/users/{id}.json'
        },
        update: {
          url: '/users/{id}.json'
        },
        "delete": {
          url: '/users/{id}.json'      
        }
    });

    // Define another API resource
    Zendesk.organizations = Collection.initialize('organization', { ... });

    // Export your new API client
    module.exports = Zendesk;

Resources can be anything, as long as the following conventions apply:

- HTTP POST for creating 
- HTTP GET for reading (by id) and listing (without id)
- HTTP PUT for updating 
- HTTP DELETE for deleting

Also:

- Results should be returned as JSON from the API
- Create operations should accept data encoded as a JSON object via POST


# Accessing your API via the pixie dust powered client

Note that this does not have to be accessing users - you can generate a client for any RESTful resource.

## Loading a single item
 
    Zendesk.users(1).each(function(user) {
      console.log(user);
    });   

## Loading multiple items

Note that this will trigger multiple reads in the background, and call your function when all the results are available.

    // print an array of users 1, 2, 3

    Zendesk.users([1, 2, 3], function(users) {
      console.log(users);
    });

    // if you just want to apply a callback to each item, use .each()

    // print users 1, 2, 3

    Zendesk.users([1, 2, 3]).each(function(user) {
      console.log(user);
    });


## Default string search can be defined

You can define the search performed when you are not passing a number.

    Zendesk.users("End User").each(function(user) {
      console.log(user);
    });


## Paginated results (if the underlying API paginates results)

    // print every user on page 1

    Zendesk.users().page(1).each(function(user) {
      console.log(user);
    });

    // per_page(15)


## Additional search terms can be combined (if the underlying API supports this)

   

## Sorting

Sorting will be applied to the results from the API -- it does not require that the underlying API supports this.

This means that if the results paginated but the underlying API does not support sorting, then you need to fetch all items to ensure global sort order.

    Zendesk.users().sort(function(a, b) { 
      // return 0, 1, or -1 as in normal array sort functions
      return a.name.localeCompare(b.name);
    }).each(function(user){
      
    });

    // Equivalent quick syntax:

    Zendesk.users().sort('user.name').each(function(user){
     
    });


## Filtering

Filters will be applied to the results from the API -- it does not require that the underlying API supports this.

Filters allow you to express additional condtions which are not supported by the underlying API. Since filters are applied afterwards, note that with result pagination this may lead to an uneven (or empty) result set.

    Zendesk.users().filter(function(item) { return (item.id % 2 == 0); }).each(function(user){
      // only process items where id is even.    
    });


## Creating a single item

    Zendesk.users().create({
      name: 'John Doe',
      email: 'test@example.com'
    });

    // Optional callback after the operation is complete

    Zendesk.users().create({
      name: 'John Doe',
    }, function(user) {
      console.log('User id is', user.id);
    });

## Updating items

    Zendesk.users({name: 'John Doe'}).each(function(user){
      user.update({email: 'foo@bar.com'});
    });

    // Optional callback after the operation is complete

    Zendesk.users({name: 'John Doe'}).each(function(user){
      user.update({email: 'foo@bar.com'}, function(user) {
        console.log(user);
      });
    });

## Deleting items

    Zendesk.users({name: 'John Doe'}).each(function(user){
      user.del();
    });

    // Optional callback after the operation is complete

    Zendesk.users({name: 'John Doe'}).each(function(user){
      user.del(function() {
        // do whatever
      });
    });

## Delayed operations

    var selected = Zesdesk.users();

    selected.where( { role: 4 });
    selected.sort('user.name');
    selected.page(2);
    selected.where({ organization: 1});

    // the search only executes when you pass a callback to it

    selected.each(function(user) {
      console.log(user);
    });

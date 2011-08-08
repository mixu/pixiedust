# Pixie dust (.js)

Sprinkle this over your REST API definition to generate a chainable Node REST API client.

# Creating an API client from a definition

    Zendesk = {}
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

# Accessing the API

    // print users with name "End User"
    Zendesk.users("End User").each(function(user){
      console.log(user);  
    });

    // get single user
    Zendesk.users(6).each(function(user){
      console.log(user);  
    });

    // print every user on page 1
    Zendesk.users().page(1).each(function(user) {
      console.log(user);
    });

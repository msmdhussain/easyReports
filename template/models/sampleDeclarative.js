
/*
 This is a sample json model heavily commented  to help you get started.
 models and app.js are the two main things you need to work with to build reports.
 easyrep works in both declarative and impreative approach. 
 models are js files where you declare or program  the following:
  1) what params you expect in you get request which of them are mandatory.
  2) what table/s you need to query and what fields you need / based on request params.
  3) how do you wish to display your report data. 

  Point 1) is specified in field "request"
  Point 2) is specified in the field "query"
  Point 3 is specified in field "display"
  
 Below model works with two tables described below.. 

 mysql> desc easyrep_sample_logs
 +---------+--------------+------+-----+---------+----------------+
 | Field   | Type         | Null | Key | Default | Extra          |
 +---------+--------------+------+-----+---------+----------------+
 | id      | int(11)      | NO   | PRI | NULL    | auto_increment |
 | user_id | int(11)      | NO   |     | NULL    |                |
 | daydate | date         | NO   |     | NULL    |                |
 | action  | varchar(100) | YES  |     | NULL    |                |
 +---------+--------------+------+-----+---------+----------------+
  
 mysql> desc easyrep_sample_users;
 +-------+--------------+------+-----+---------+----------------+
 | Field | Type         | Null | Key | Default | Extra          |
 +-------+--------------+------+-----+---------+----------------+
 | id    | int(11)      | NO   | PRI | NULL    | auto_increment |
 | name  | varchar(100) | NO   |     | NULL    |                |
 | role  | varchar(100) | NO   |     | NULL    |                |
 | email | varchar(100) | NO   |     | NULL    |                |
 +-------+--------------+------+-----+---------+----------------+

 Note: After configuring your database use "easyrep testdata" to load data for the above table and check this model in action

 The strategry of the model below is to not do the join in mysql but makes an hashjoin in easyrep, this is done just to explain easyrep's features.
 
 The model below creates and fires 2 queries one for the main table easyrep_sample_logs and the other for easyrep_sample_users.
 Both outputs are used to build the final report json based on the field "display"
*/


// BELOW IS AN EXAMPLE OF A DECLARATIVE MODEL
var app = require("../app.js");// business logic file
module.exports= function(){

	return  {
    
    //Cache duration.. optional attribute to set cache duration for this model.. works only  when memcache list is define in config

//    cacheDuration:10,

    // all get/post request params are passed in as params this can be validated for manadtory params,filtered (to modify the params before sending them query processing logic and sensible defautls could be added"
    request:{
      mandatory:["sdate","edate"], // mandatory fields expected in web request
      defaults:{ // default params used in query i.e. in absence of query params from web request
        orderBy:"daydate", 
        dir:"desc" ,
        page:0, 
        rowsPerPage:20
      }
      /*
       * filter:{
       *   sdate:function(date){ //logic to format and return date here } // sdate is pattern matched with input params
       * }
       */
    },

    query:{ 
    /* dynamic query is built using underscorejs templating library. Object "p" holds the params you get from web request along with defaults provided bleow. "p" has only method escape. used to escapre param values to prevent SQL injection.
    note: page & rowsPerPage are hardcoded parasm used in server for pagination. These should not be specified in templating, they are added directly by the framework code
    */


      select:" select id as id, user_id as user_id, daydate  as daydate, action as action  from easyrep_sample_logs <% if( p.sdate && p.edate ) { %> where daydate between <%= p.escape('sdate') %> and <%= p.escape('edate') %> <% } %>  order by <%= p.orderBy %> <%= p.dir %> ", 
      joins:{ // An alternative approach to using sql join statments is to excute the other query in parallel and use hashmap join
        user:{ //name of the alternate query.. note this is used in display to refer to this queries output 
          on:["user_id"], // join field.. key to hashmap used in building the join. (note user_id alias should be present both in main query and join query
          select:"select id as user_id, name as name, email as email  from easyrep_sample_users" // join query 
        }
      }
        
    },
    /* display - defines  output table json..
       key referst to alias is the alias from queries above. 
       join="users" refers alias in join query of users table above" 
       format = is used to fromat output from query results
       format=app.capitalize is used to apply capitalize transformation as defined in app.js
       Note: format function is defined as 
       function(row,results,val,key,cache,callback)
        row - raw row object from sql query
        results: is high level object with mappings to joins.. you can acces join result (this would be changed to joins holidng join rows)
        val: value of the column given in key - null if no key is specified
        key: key of the column called
        cache: object refrence to memcache if defined else null
        callback: - callback function used to send the result back in a nonblocking mode

      Check app.js for the implementation of capitalize
     */
    display:{
      name    :	{  key : "name", join:"user", header:"Name", format:app.capitalize}, // check app.js for capitalize definition
      // uncomment the below column if you got memecache running
      email   :	{  key : "email", join:"user", header :"Email"},
      action  : 	{  key : "action", header :"Action" },
      daydate :	{  key : "daydate", header :"Date"}
    }
  }
};


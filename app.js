//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connecting mongoose with database mongodb
mongoose.connect("mongodb+srv://admin-neha:nehamongodbatlas@cluster0.gwxqi.mongodb.net/todoListDB", {useNewUrlParser: true,  useUnifiedTopology: true });

const itemsSchema={        //creating schema for table
   name: String
}

const Item=mongoose.model("Item", itemsSchema);  //creating Model or table Item.In out DB it Item table will be referred as "items"

const item1= new Item({
  name: "Welcome to your ToDoList. "
});

const item2= new Item({
  name: "Hit the + button to add an item." 
});
const item3= new Item({
  name: "<-- check this to delete an item." 
});

const defaultItems=[item1, item2, item3];

const listSchema={
  name: String,
  items: [itemsSchema]
};
const List=mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({},function(err, resultedItems)
  {
    if(resultedItems.length==0)
    {
      Item.insertMany(defaultItems, function(err)  //inserted defaultitem array in out table Item if empty
      {
        if(err)
        console.log(err);
        else
        {
          console.log("Items added Successfully.");
        }
      });
    }
    
    else{
      res.render("list", {listTitle: "Today", newListItems: resultedItems});
    }
  });
  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;
  
  const item= new Item({    //to insert user typed item into database without requiring array.
    name: itemName
  });
  if(listName==="Today")
  {
    item.save();
    res.redirect("/");
  }else{
      List.findOne({name: listName}, function(err, foundList)
      {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
      })
  }
});
app.post("/delete",function(req, res){
  const checkedItem=req.body.checkedItem;
  const listName=req.body.listName;

  if(listName==="Today")
  {
    Item.findByIdAndRemove(checkedItem, function(err)
    {
      if(err)
      console.log(err);
      else
      {
          res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItem}}},function(err, foundItem){
      if(!err)
      res.redirect("/"+listName);
    });
  }
}); 
     
    

//dynamic route
app.get("/:customListName", function(req, res){

  const requestedParam=_.capitalize(req.params.customListName);
  List.findOne({name: requestedParam}, function(err, foundItem){
    if(!err)
    {
      if(!foundItem)
      {
        //create new list
        const list= new List({
             name: requestedParam,
             items: defaultItems
           });
           list.save();
           res.redirect("/"+requestedParam);
      }
      else{
        res.render("list",{listTitle:foundItem.name, newListItems: foundItem.items });
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server startedsuccessfully");
});

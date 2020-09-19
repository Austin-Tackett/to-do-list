//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const dateFormat = require('dateformat');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.use(
	bodyParser.urlencoded({
		extended : true
	})
);

let port = process.env.PORT;
if (port == null || port == '') {
	port = 3000;
}

app.listen(port, function (req, res) {
	console.log('Server Started 3000');
});

//create DB using mongoose and MongoDB
mongoose.connect('DB_Address', { useNewUrlParser: true, useUnifiedTopology: true });

//Create "Items" Schema
const itemSchema = {
	name : { type: String, required: [ true, 'Needs a Name' ] }
};

//Create new model. Use singular verison of collection name.
const Item = mongoose.model('Item', itemSchema);

//Create new doc using mongoose
const item1 = new Item({
	name : 'This is your To Do List'
});

const item2 = new Item({
	name : 'Hit the + Button to add a new item'
});

const item3 = new Item({
	name : '<-- Hit the checkbox when you complete the task'
});

//Create array of default to do list items
const defaultItems = [ item1, item2, item3 ];

const listSchema = {
	name  : String,
	items : [ itemSchema ]
};

const List = mongoose.model('List', listSchema);

//Serve up "public" folder from server side. Use to serve CSS, Images, Audio, Etc.
app.use(express.static('Public'));

app.set('view engine', 'ejs');

//Home Route
app.get('/', function (req, res) {
	//Find all items in collection
	Item.find({}, function (err, foundItems) {
		//Check to see if collection is empty
		if (foundItems.length === 0) {
			//Insert array into "Item" collection
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log('Succesfully saved default items to DB');
				}
			});
			res.redirect('/');
		} else {
			res.render('list', { listTitle: 'Today', itemsList: foundItems });
		}
	});
});

app.get('/:customListName', function (req, res) {
	const customListName = _.capitalize(req.params.customListName);

	//Use "findOne" so that a single object is returned
	List.findOne({ name: customListName }, function (err, foundList) {
		if (!err) {
			if (!foundList) {
				//Creates a new list
				const list = new List({
					name  : customListName,
					items : defaultItems
				});
				list.save();
				res.redirect('/' + customListName);
			} else {
				//Show an existing list
				res.render('list', { listTitle: foundList.name, itemsList: foundList.items });
			}
		}
	});
});

app.post('/', function (req, res) {
	const itemName = req.body.submittedItem;
	const listName = req.body.list; //"list" is name attribute of button in list.ejs

	const item = new Item({
		name : itemName
	});

	//add new item to default list, else add item to custom list
	if (listName === 'Today') {
		item.save();
		res.redirect('/');
	} else {
		List.findOne({ name: listName }, function (err, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect('/' + listName);
		});
	}
});

app.post('/delete', function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === 'Today') {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (!err) {
				console.log('item deleted');
			}
			res.redirect('/');
		});
	} else {
		List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (
			err,
			foundList
		) {
			if (!err) {
				res.redirect('/' + listName);
			}
		});
	}
});

//About Route
app.get('/about', function (req, res) {
	res.render('about');
});

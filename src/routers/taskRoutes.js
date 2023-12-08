const express = require('express');
const { TaskModel, taskFields } = require('../models/to-do.model');
const { UserModel } = require('../models/user.model');

const router = new express.Router();

// TASKS API

// create new task
/* 
    request schema
    {
        "task": "Learn Node", // required
        "completed": false
    }
*/
router.post('/tasks/create', async (req, res) => {
    const checkAndAdd = async () => {
        const {task} = req.body;
        const [taskInDb] = await TaskModel.find({task, author: req.user._id});
        if(!taskInDb) {
            const taskObj = {...req.body, author: req.user._id};
            const saved = await new TaskModel(taskObj).save();
            return {status: 200, msg: saved}
        } else {
            return {status: 400, msg: 'Duplicate task.'}
        }
    }

    checkAndAdd().then(saveRes => {
        res.status(saveRes.status).send(saveRes.msg);
    }).catch(e => {
        res.status(500).send(e);
    })
})

// get Tasks

/* 
    request schema

    {
        "filter": {
            "completed": false,
            "priority": 'Gray'
            "pageSize": 1,
            "page": 2
        }, "sort": {
            "task": "asc"
        }
    }  
*/
router.post('/tasks/getTasks', async (req, res) => {
    // after setting up a relation b/w user and tasks using virtual field (in user model)

    try {
        const reqInfo = req.body;
        let match = {};
        let options = {};
        if(reqInfo.filter) {
            if(reqInfo.filter.page && reqInfo.filter.pageSize) {
                options = {...options, limit: reqInfo.filter.pageSize, skip: reqInfo.filter.pageSize * (reqInfo.filter.page - 1)}
            }

            if(reqInfo.filter.completed) {
                match = {completed: reqInfo.filter.completed}
            }

            if(reqInfo.filter.priority) {
                match = {...match, priority: reqInfo.filter.priority}
            }
        }

        if(reqInfo.sort) {
            const sortOpt = Object.keys(reqInfo.sort)[0];
            options = {...options, sort: {
                [sortOpt]: reqInfo.sort[sortOpt] === 'desc' ? -1 : 1
            }}
        }

        await req.user.populate({
            path: 'tasks',
            match,
            options
        }).execPopulate();
        res.status(200).send(req.user.tasks)

    } catch (e) {
        res.status(500).send(e);
    }


    /* TaskModel.find({author: req.user._id}).then(tasks => {
        res.status(200).send(tasks);
    }).catch(e => {
        res.status(500).send(e);
    }) */
});

// get task by Id route
router.get('/tasks/getTasks/:id', (req, res) => {

    TaskModel.findOne({author: req.user._id, _id: req.params.id}).then(task => {
        if(!task) {
            res.status(404).send('Task not found');
        }
        res.status(200).send(task);
    }).catch(e => {
        res.status(500).send(e);
    })
});

// update tasks
/* 
    request schema
    {
        "task": "Learn Node", 
        "completed": false
    }
*/

router.post('/tasks/updateTask/:id',async (req, res) => {
    const isValid = Object.keys(req.body).every(key => taskFields.includes(key));
    if(!isValid) {
        res.status(400).send('Invalid fields in request');
    }

    try {
        const taskUpdated = await TaskModel.findOneAndUpdate({_id: req.params.id, author: req.user._id}, req.body, { new: true, runValidators: true });
        if(!taskUpdated) {
            res.send(404).send('Task not found');
        } else {
            res.status(200).send(taskUpdated);
        }
    } catch (e) {
        if(e.kind === 'ObjectId') res.status(404).send('Invalid Task Id.');
        res.status(400).send(e);
    }

});

// delete task

router.delete('/tasks/deleteTask/:id', async (req, res) => {
    try {
        const deleted = await TaskModel.findOneAndDelete({author: req.user._id, _id: req.params.id});
        
        if(!deleted) {
            res.status(404).send('Invalid Task Id')
        }

        res.status(200).send(deleted);
    } catch(e) {
        res.status(500).send('Something went wrong. Please try again.')
    }
})

module.exports = router;
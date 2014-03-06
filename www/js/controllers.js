/**
 * 
 */


//http://stackoverflow.com/questions/11868393/angularjs-inputtext-ngchange-fires-while-the-value-is-changing
// override the default input to update on blur
var taskListApp = angular.module('taskListApp', ['ngAnimate']).directive('ngModelOnblur', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elm, attr, ngModelCtrl) {
            if (attr.type === 'radio' || attr.type === 'checkbox') return;

            elm.unbind('input').unbind('keydown').unbind('change');
            elm.bind('blur', function() {
                scope.$apply(function() {
                    ngModelCtrl.$setViewValue(elm.val());
                });
            });
        }
    };
});;


function TaskListCtrl($scope, $http, $interval) {

    function updateToday() {

        var now =  new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());

    }

    $scope.today = updateToday();


// get the day from the localtime zone in UTC.
function getDay(delta) {
    if (delta === null) {
        return null;
    }
    // get the day according to the local timezone
    // but store it in UTC. always UTC :)

    return Date.UTC($scope.today.getFullYear(), $scope.today.getMonth(), $scope.today.getDate() + delta);
}


function Task(task) {
    if (!(typeof task == 'string' || task instanceof String)) {
        // this is an obj, and not a string. we are deserializing
        // http://stackoverflow.com/a/5873875/328631
        for (var prop in task) this[prop] = task[prop];
        this.praseProjAndContext();
        return;
    }

    //var words = task.split(/\s+/);
    var words = task.split(' ');

    // TODO: remove leading spaces:

    var dueDate = this.getDueDate(words);
    var priority = this.getPriority(words);

    // always UTC :)
    this.dueDate = dueDate;
    this.priority = priority;

    this.projects = [];
    this.context = [];
    this.done = false;
    this.notes = "";
    this.createdDate = new Date().getTime();

    this.desc = words.join(' ');

    this.praseProjAndContext();
}

Task.prototype.getDueDate = function(words) {
   var firstWord = words[0].toLowerCase();
    if (firstWord == "today") {
        // remove the first word from the original task, as we know it describes the date
        words.splice(0,1);
        return getDay(0);
    }

   if (firstWord[0] === '+') {
       words.splice(0,1);
       return getDay(parseInt(firstWord.substring(1)));
   }


   if (firstWord[0] === '-') {
       words.splice(0,1);
       return getDay(parseInt(firstWord));
   }

   return null;
}

Task.prototype.getPriority = function(words) {

    var firstWord = words[0].toLowerCase();
    if (firstWord === "a" ) {
        words.splice(0,1);
        return "A";
    }
    if (firstWord === "b" ) {
        words.splice(0,1);
        return "B";
    }

    if (firstWord === "c" ) {
        words.splice(0,1);
        return "C";
    }

   return null;
}

Task.prototype.praseProjAndContext = function() {
    var words = this.desc.split(' ');

    this.projects.length=0;
    this.context.length=0;
    for (var i = 0; i < words.length; ++i){
        var entry = words[i];
        if(entry[0] === '@') {
            this.projects.push(entry.substring(1));
        }
        if(entry[0] === '+') {
            this.context.push(entry.substring(1));
        }
    }
}

Task.prototype.descChanged = function() {
    // re-parse the context and project parts.
    this.praseProjAndContext();
}

    Task.prototype.isOverdue = function(){

        return this.dueDate !== null && this.dueDate < getDay(0);
}
Task.prototype.isToday = function(){

    return getTaskFilter(getDay(0), getDay(1))(this);
}

/////////////////// Data models
    $scope.getDay = getDay;
    $scope.tasks = [];

    $scope.currentTask = null;

    $scope.currentT = "";
    // submodels per category
    $scope.categories = [
                ["Overdue", [], [null,0]] ,
                ["Today",   [], [0,1]] ,
                ["Tomorrow",[], [1,2]] ,
                ["Next Seven Days", [] , [2,7]] ,
                ["Future", [], [7, null]]
                        ];

////// Add a new task
  $scope.addTask = function() {
    var task = $scope.newTask;
    if (task &&  task.length) {
        $scope.tasks.push(new Task(task));
        $scope.newTask = "";
    }
  };

/////////////////////////// Task filters according to time range.
    function  isTaskInRange(task, start, end) {
         if (task.dueDate === null) {
             if(end === null) {
                 return true;
             }
         } else if (start === null && task.dueDate < end) {
             return true;
         } else if (end === null && task.dueDate >= start) {
             return true;
         } else if (task.dueDate >= start && task.dueDate < end) {
             return true;
         }
        return false;
    }

    function getTaskFilter(start, end) {
        return function(task) {
            return isTaskInRange(task, start, end);
        }

    }
   $scope.getTaskFilter = getTaskFilter;



/////////// watch for changes and save them. remove done tasks

    function tasksChanged(newTasks, oldTAsks) {

        // serialize
        localStorage["tasks"] = JSON.stringify($scope.tasks);

        // ideally find out exactly what changed and update a backend on it.
        // i.e get the sets of remove tasks, new tasks, and changed tasks.
    }

    $scope.$watch('tasks', tasksChanged, true);

    function removeTask(task){
        var len = $scope.tasks.length
        while (len--) {
            if ($scope.tasks[len] === task) {
                $scope.tasks.splice(len,1);
                return;
            }
        }
    }
    $scope.doneClicked = function(task) {
        if (task.done) {
            task.removeTask = setTimeout(function(){removeTask(task)}, 5*1000);
        } else if (task.removeTask ) {
            clearTimeout(task.removeTask);
            task.removeTask = null;
        }

    }

    var updateTodayTask = $interval(function(){$scope.today = updateToday();}, 5*1000);
    $scope.$on('$destroy', function() {
      // Make sure that the interval is destroyed too
      $interval.cancel(updateTodayTask);
    });
////////////////// make sure dates are properly displayed in the UI
    /////////// http://stackoverflow.com/questions/20662140/using-angularjs-date-filter-with-utc-date

    var toUTCDate = function(date){
      var _utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
      return _utc;
    };

    var millisUTCToLocalDate = function(millis){
      return toUTCDate(new Date(millis));
    };

    $scope.millisUTCToLocalDate = millisUTCToLocalDate;

    $scope.getChosenDate = function() {
        if ($scope.chosenDate) {
            var chosenDate = new Date(Date.parse($scope.chosenDate));
            return Date.UTC(chosenDate.getFullYear(), chosenDate.getMonth(), chosenDate.getDate());
        }
        return null;

    }
////////////// Ordering
    $scope.getTaskOrder = function(t) {
        if (t.priority === null) {
            // null is low priority
            return "Z";
        }
        return t.priority;
    }

    // set the current task - for dialog boxes.
   $scope.setTask = function(task) {
       $scope.currentTask = task;
   }

////////// Load existing tasks
    if(localStorage["tasks"]) {
        JSON.parse(localStorage["tasks"]).forEach(function(t) {
            $scope.tasks.push(new Task(t));
        }
        );
    }
}



taskListApp.controller('TaskListCtrl', TaskListCtrl);

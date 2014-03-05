/**
 * 
 */


var taskListApp = angular.module('taskListApp', ['ngAnimate']);


function TaskListCtrl($scope, $http, $interval) {
function getDay(delta) {
        // get the day according to the local timezone
        var now = new Date();
        // but store it in UTC. always UTC :)
        return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + delta);
}


function Task(task) {
    if (!(typeof task == 'string' || task instanceof String)) {
        // this is an obj, and not a string. we are deserializing
        // http://stackoverflow.com/a/5873875/328631
        for (var prop in task) this[prop] = task[prop];
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
 

    for (var i = 0; i < words.length; ++i){
        var entry = words[i];
        if(entry[0] === '@') {
            this.projects.push(entry.substring(1));
        }
        if(entry[0] === '+') {
            this.context.push(entry.substring(1));
        }
    }


    this.desc = words.join(' ');
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

/////////////////////////////////////////////////////////////////////////////
    $scope.getDay = getDay;
    $scope.tasks = [];

    $scope.currentTask = null;

    $scope.currentT = "";

    // these will get updated form the parent obj when it is changed..
    $scope.pastDue = [];
    $scope.todaysTasks = [];
    $scope.tomorrowsTasks = [];
    $scope.nextSevenTasks = [];
    $scope.futureTasks = [];

    $scope.categories = [["Overdue", $scope.pastDue] ,
                         ["Today",   $scope.todaysTasks] ,
                         ["Tomorrow",$scope.tomorrowsTasks] ,
                         ["Next Seven Days",   $scope.nextSevenTasks] ,
                         ["Future",   $scope.futureTasks]];


  $scope.addTask = function() {
    var task = $scope.newTask;
    if (task &&  task.length) {
        $scope.tasks.push(new Task(task));
        $scope.newTask = "";
    }
  };

  // if end is null includes all the tasks without a date
  // list is ordered
  $scope.getTaskForDate = function(start, end) {
     var result = [];
     for (var i = 0; i < $scope.tasks.length; ++i) {
         var task = $scope.tasks[i];
         if (task.dueDate === null) {
             if(end === null) {
                 result.push(task);
             }
         } else if (start === null && task.dueDate < end) {
             result.push(task);
         } else if (end === null && task.dueDate >= start) {
             result.push(task);
         } else if (task.dueDate >= start && task.dueDate < end) {
             result.push(task);
         }
     }
     return result;
  }

   $scope.setTask = function(task) {
       $scope.currentTask = task;
   }
  
    function refreshTasks(value) {
            // get the day according to the local timezone
            var now = new Date();

            // data is stored as UTC, so convert.
            var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
            var tomorrow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            var afterTomorrow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 2);
            var weekFromToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 7);

          $scope.pastDue.length = 0;
          $scope.getTaskForDate(null, today).forEach(function(entry){$scope.pastDue.push(entry);});

          $scope.todaysTasks.length = 0;
          $scope.getTaskForDate(today, tomorrow).forEach(function(entry){$scope.todaysTasks.push(entry);});

          $scope.tomorrowsTasks.length = 0;
          $scope.getTaskForDate(tomorrow, afterTomorrow).forEach(function(entry){$scope.tomorrowsTasks.push(entry);});

          $scope.nextSevenTasks.length = 0;
          $scope.getTaskForDate(afterTomorrow, weekFromToday).forEach(function(entry){$scope.nextSevenTasks.push(entry);});

          $scope.futureTasks.length = 0;
          $scope.getTaskForDate(weekFromToday, null).forEach(function(entry){$scope.futureTasks.push(entry);});

      }

    function tasksChanged(newTasks, oldTAsks) {
        refreshTasks();

        // serialize
        localStorage["tasks"] = JSON.stringify($scope.tasks);

        // ideally find out exactly what changed and update a backend on it.
        // i.e get the sets of remove tasks, new tasks, and changed tasks.
    }

    $scope.$watch('tasks', tasksChanged, true);

    if(localStorage["tasks"]) {
        JSON.parse(localStorage["tasks"]).forEach(function(t) {
            $scope.tasks.push(new Task(t));
        }
        );
    }

    $scope.deleteDone = function() {
        var len = $scope.tasks.length
        while (len--) {
            if ($scope.tasks[len].done) {
                $scope.tasks.splice(len,1);
            }
        }
    }

    var deleteDoneTask = $interval($scope.deleteDone, 5*1000);
    $scope.$on('$destroy', function() {
      // Make sure that the interval is destroyed too
      $interval.cancel(deleteDoneTask);
    });

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

    $scope.getTaskOrder = function(t) {
        if (t.priority === null) {
            return "Z";
        }
        return t.priority;
    }
}


taskListApp.controller('TaskListCtrl', TaskListCtrl);

/**
 * 
 */


var taskListApp = angular.module('taskListApp', ['ngAnimate']);


function TaskListCtrl($scope, $http, $interval) {
function getDay(delta) {
        var now = new Date();
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta)
        return d.getTime();
}


function Task(task) {

    //var words = task.split(/\s+/);
    var words = task.split(' ');

    // TODO: remove leading spaces:

    var dueDate = this.getDueDate(words);
    var priority = this.getPriority(words);

    this.dueDate = dueDate;
    this.priority = priority;

    this.projects = [];
    this.context = [];
    this.done = false;
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
   var firstWord = words[0];
   if (firstWord.toLowerCase() == "today") {
       // remove the first word from the original task, as we know it describes the date
       words.splice(0,1);
       return getDay(0);
   }

   if (firstWord[0] === '+') {
       words.splice(0,1);
       return getDay(parseInt(firstWord.substring(1)));
   }

   return null;
}

Task.prototype.getPriority = function(words) {
   return null;
}


    $scope.getDay = getDay;
    $scope.tasks = [];

    $scope.currentTask = null;

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

   $scope.change = function(task, value) {
       if (!value) {
           task.dueDate = null;
       } else {
           task.dueDate = parseInteger(value);
       }
   }
  
    function refreshTasks(value) {
            var now = new Date();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
            var afterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).getTime();
            var weekFromToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).getTime();

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
  $scope.$watch('tasks', refreshTasks, true);
  
}


taskListApp.controller('TaskListCtrl', TaskListCtrl);

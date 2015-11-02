/*
 * The GeoTag-X project helper.
 */
;(function(geotagx, $, undefined){
	"use strict";

	var api_ = {}; // The project API.
	var shortName_; // The project's short name.

	/**
	 * Begins the project.
	 * @param shortName the project's short name.
	 * @param controlFlow a dictionary that maps an answer to a question key.
	 */
	api_.start = function(shortName, controlFlow, isTutorial, tutorials){
		if ($.type(shortName) !== "string"){
			console.log("[geotagx::project::start] Error! Invalid project slug.");
			return;
		}
		shortName_ = shortName;
		geotagx.questionnaire.setControlFlow(controlFlow);

		if (isTutorial){
			geotagx.tutorial.start(shortName, tutorials);
			geotagx.analytics.onStartTutorial(shortName_);
		}
		else {
			pybossa.taskLoaded(onTaskLoaded);
			pybossa.presentTask(onPresentTask);
			pybossa.run(shortName_);
			geotagx.analytics.onStartProject(shortName_);
		}
	};
	/**
	 * Returns the project's short name.
	 */
	api_.getShortName = function(){
		return shortName_;
	};
	/**
	 * Handles PyBossa's taskLoaded event.
	 */
	function onTaskLoaded(task, deferred){
		if (!$.isEmptyObject(task)){
			task.photoAccessible = true;

			// Cache the image for later use.
			$("<img>")
			.load(function(){ deferred.resolve(task); })
			.error(function(e){
				task.photoAccessible = false;
				deferred.resolve(task);
			})
			.attr("src", task.info.image_url);
		}
		else
			deferred.resolve(task);
	}
	/**
	 * Handles PyBossa's presentTask event.
	 */
	function onPresentTask(task, deferred){
		if (!$.isEmptyObject(task)){
			if (task.photoAccessible){
				// Show/hide respective elements.
				$(".show-on-task-loaded").removeClass("show-on-task-loaded").hide().fadeIn(200);
				$(".hide-on-task-loaded").hide();

				// Update the user progress.
				pybossa.userProgress(shortName_).done(function(data){
					$("#project-task-count").text(data.done + "/" + data.total);
				});

				geotagx.questionnaire.setImage(task.info.image_url, task.info.source_uri);

				// Set the submission button's handler. Note that off().on() removes the previous handler
				// and sets a new one, every time a new task is loaded. This prevents a chain of events
				// being called when a button is pushed once.
				$("#submit-analysis").off("click.task").on("click.task", function(){
					var $submitButton = $("#submit-analysis");
					var $busyIcon = $("#questionnaire-busy-icon");

					// Disable the submit button and display the busy icon.
					$busyIcon.removeClass("hide").hide().fadeIn(300);

					$submitButton.toggleClass("busy btn-success");
					$submitButton.prop("disabled", true);

					submitTask(task, deferred);
				});
				geotagx.analytics.onTaskChanged(task.id);
				geotagx.questionnaire.start();
			}
			else
				submitTask(task, deferred);
		}
		else {
			// If there're no more tasks, then hide the questionnaire and image,
			// then display the participation appreciation message.
			$("#participation-appreciation-section").removeClass("hide");
			$("#questionnaire-section").addClass("hide");
			$("#image-section").addClass("hide");
			$("#project-task-presenter-header").addClass("hide");
		}
	}
	/**
	 * Submits the specified task.
	 */
	function submitTask(task, deferred){
		// Append image information to the questionnaire results.
		var taskRun = geotagx.questionnaire.getAnswers();
		taskRun.img = task.info.image_url;
		taskRun.photoAccessible = task.photoAccessible;
		taskRun.photoVisible = taskRun.photoAccessible && taskRun.photoVisible;

		if (task.photoAccessible === false){
			function onResolve(){
				deferred.resolve();
			}
			// If the photo is not accessible, submit the task and load another.
			pybossa.saveTask(task.id, taskRun).done(onResolve).fail(onResolve);
		}
		else if (task.photoAccessible === true){
			var $submitButton = $("#submit-analysis");
			var $busyIcon = $("#questionnaire-busy-icon");

			pybossa.saveTask(task.id, taskRun)
			.done(function(){
				$busyIcon.fadeOut(300, function(){ $(this).addClass("hide"); });

				// Display the status message.
				var $message = $("#submit-message-success");
				$message.removeClass("hide");
				setTimeout(function(){
					deferred.resolve();
					$message.addClass("hide");
					$submitButton.toggleClass("busy btn-success");
					$submitButton.prop("disabled", false);
				}, 1500);
			})
			.fail(function(response){
				$busyIcon.fadeOut(300, function(){ $(this).addClass("hide"); });
				$submitButton.toggleClass("busy btn-success");
				$submitButton.prop("disabled", false);

				var $message = $("#submit-message-failure");

				// If the status code is 403 (FORBIDDEN), then we assume that the
				// data was sent but the deferred object has not yet been resolved.
				if (response.status === 403){
					deferred.resolve();
					$message.addClass("hide");
				}
				else {
					$message.removeClass("hide");
					$submitButton.one("click", function(){
						$message.addClass("hide");
					});
				}
			});
		}
	}
	// Expose the API.
	geotagx.project = api_;
})(window.geotagx = window.geotagx || {}, jQuery);

/*
 * The GeoTag-X project analytics tracker.
 */
;(function(geotagx, $, undefined){
	"use strict";

	var api_ = {}; // The project-specific analytics API.
	var taskId_ = 0; // The current task's identifier.
	var projectId_ = null; // The current project's short name.
	var questionId_ = null; // The current question number.
	var previousQuestionId_ = null; // The previous question number.
	var queuedEvents_ = []; // A queue to store events that have not been fired because the analytics was not configured yet.

	$(document).on("geotagx-analytics-disabled", function(){
		// When the analytics have been disabled, we need to stop queueing all new events.
		submitEvent = function(name, data){};
	});

	$(document).on("geotagx-analytics-configured", function(){
		// Since the analytics is ready, bind the submitEvent to the fireEvent
		// method so that it no longer queues events.
		submitEvent = analytics.fireEvent.bind(analytics);

		// Fire any deferred events before setting up the rest.
		for (var i = 0; i < queuedEvents_.length; ++i){
			var event = queuedEvents_[i];
			analytics.fireEvent(event.name, event.data);
		}
		queuedEvents_.length = 0; // Empty the queue.

		$("#project-task-presenter.analysis .btn-answer").on("click.analytics", onAnswerQuestion);

		$("#project-task-presenter.tutorial #image").on("zoom.analytics", _debounce(onTutorialImageZoom, 350));
		$("#project-task-presenter.analysis #image").on("zoom.analytics", _debounce(onImageZoom, 350));

		$("#project-task-presenter.tutorial #image-source").on("click.analytics", onShowTutorialImageSource);
		$("#project-task-presenter.analysis #image-source").on("click.analytics", onShowImageSource);

		$("#project-task-presenter.tutorial #questionnaire-no-photo").on("click.analytics", onNoTutorialImage);
		$("#project-task-presenter.analysis #questionnaire-no-photo").on("click.analytics", onNoImage);

		$("#project-task-presenter.tutorial #questionnaire-rewind").on("click.analytics", onShowPreviousTutorialQuestion);
		$("#project-task-presenter.analysis #questionnaire-rewind").on("click.analytics", onShowPreviousQuestion);

		$("#project-task-presenter.tutorial #questionnaire-show-comments").on("click.analytics", onShowTutorialComments);
		$("#project-task-presenter.analysis #questionnaire-show-comments").on("click.analytics", onShowComments);

		$("#project-task-presenter.tutorial .help-toggle").on("click.analytics", onShowTutorialHelp);
		$("#project-task-presenter.analysis .help-toggle").on("click.analytics", onShowHelp);

		$("#submit-analysis").on("click.analytics", onSubmitTask);

		$("#skip-tutorial").on("click.analytics", onSkipTutorial);
		$("#start-contributing").on("click.analytics", onCompleteTutorial);
	});
	/**
	 * Updates the tracking parameters when a new task is presented to the user.
	 * @param taskId the task's identifier.
	 */
	api_.onTaskChanged = function(taskId){
		taskId_ = taskId;
		var data = {
			"projectId":projectId_,
			"taskId":taskId_
		};
		analytics.fireEvent("action.startTask", data);
	};
	/**
	 * Updates the tracking parameters when a new question is presented to the user.
	 * @param questionId the current question identifier.
	 */
	api_.onQuestionChanged = function(questionId){
		previousQuestionId_ = questionId_ == null ? questionId : questionId_; // Pay attention to the trailing underscore.
		questionId_ = questionId;
	};
	/**
	 * Fires an event when a user selects the correct answer in a tutorial.
	 */
	api_.onCorrectTutorialAnswer = function(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_
		};
		analytics.fireEvent("action.correctTutorialAnswer", data);
	};
	/**
	 * Fires an event when a user selects the wrong answer in a tutorial.
	 */
	api_.onWrongTutorialAnswer = function(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_
		};
		analytics.fireEvent("action.wrongTutorialAnswer", data);
	};
	/**
	 * Fires an event when a user starts a project.
	 */
	api_.onStartProject = function(projectId){
		projectId_ = projectId;
		var data = {
			"projectId":projectId_
		};
		submitEvent("action.startProject", data);
	};
	/**
	 * Fires an event when a user starts a project tutorial.
	 */
	api_.onStartTutorial = function(projectId){
		projectId_ = projectId;
		var data = {
			"projectId":projectId_
		};
		submitEvent("action.startTutorial", data);
	};
	/**
	 * Submits an event to be fired. If the analytics is not yet configured, the event is queued.
	 * Note that once the analytics is configured, the identifier 'submitEvent'
	 * is bound to the 'analytics.fireEvent' method.
	 */
	function submitEvent(name, data){
		// TODO Set a hard limit to the queue size.
		queuedEvents_.push({
			"name":name,
			"data":data
		});
	}
	/**
	 * Fires an event when a user answers a question during an analysis.
	 */
	function onAnswerQuestion(){
		// Note that we use the previousQuestionId_ because the onQuestionChanged
		// function is called before this event handler, effectively changing the
		// value of questionId_ before we have the chance to read it.
		// However, previousQuestionId_ holds the value we are looking for.
		var data = {
			"projectId":projectId_,
			"questionId":previousQuestionId_,
			"taskId":taskId_,
			"buttonValue":$(this).val()
		};
		analytics.fireEvent("action.answerQuestion", data);
	}
	/**
	 * Fires an event when a user zooms in on an image during a tutorial.
	 */
	function onTutorialImageZoom(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_
		};
		analytics.fireEvent("action.tutorialImageZoom", data);
	}
	/**
	 * Fires an event when a user zooms in on an image during an analysis.
	 */
	function onImageZoom(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_,
			"taskId":taskId_
		};
		analytics.fireEvent("action.imageZoom", data);
	}
	/**
	 * Fires an event when a user visits an image's source during a tutorial.
	 */
	function onShowTutorialImageSource(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_
		};
		analytics.fireEvent("action.showTutorialImageSource", data);
	}
	/**
	 * Fires an event when a user visits an image's source during an analysis.
	 */
	function onShowImageSource(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_,
			"taskId":taskId_
		};
		analytics.fireEvent("action.showImageSource", data);
	}
	/**
	 * Fires an event when the user does not see an image during a tutorial.
	 */
	function onNoTutorialImage(){
		var data = {
			"projectId":projectId_,
			"imageUrl":$("#image > img").data("src"),
			"imageSource":$("#image-source").attr("href")
		};
		analytics.fireEvent("action.noTutorialImage", data);
	}
	/**
	 * Fires an event when the user does not see an image during an analysis.
	 */
	function onNoImage(){
		var data = {
			"projectId":projectId_,
			"imageUrl":$("#image > img").data("src"),
			"imageSource":$("#image-source").attr("href")
		};
		analytics.fireEvent("action.noImage", data);
	}
	/**
	 * Fires an event when a user goes back to a previous question during a tutorial.
	 */
	function onShowPreviousTutorialQuestion(){
		// Note that we use the previousQuestionId_ because the onQuestionChanged
		// function is called before this event handler, effectively changing the
		// value of questionId_ before we have the chance to read it.
		// However, previousQuestionId_ holds the value we are looking for.
		var data = {
			"projectId":projectId_,
			"questionId":previousQuestionId_
		};
		analytics.fireEvent("action.showPreviousTutorialQuestion", data);
	}
	/**
	 * Fires an event when a user goes back to a previous question during an analysis.
	 */
	function onShowPreviousQuestion(){
		// Note that we use the previousQuestionId_ because the onQuestionChanged
		// function is called before this event handler, effectively changing the
		// value of questionId_ before we have the chance to read it.
		// However, previousQuestionId_ holds the value we are looking for.
		var data = {
			"projectId":projectId_,
			"questionId":previousQuestionId_,
			"taskId":taskId_
		};
		analytics.fireEvent("action.showPreviousQuestion", data);
	}
	/**
	 * Fires an event when a user clicks the 'Show Comments' button during a tutorial.
	 */
	function onShowTutorialComments(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_
		};
		analytics.fireEvent("action.showTutorialComments", data);
	}
	/**
	 * Fires an event when a user clicks the 'Show Comments' button during an analysis.
	 */
	function onShowComments(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_,
			"taskId":taskId_
		};
		analytics.fireEvent("action.showComments", data);
	}
	/**
	 * Fires an event when a user clicks a question's help toggle during a tutorial.
	 */
	function onShowTutorialHelp(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_
		};
		analytics.fireEvent("action.showTutorialHelp", data);
	}
	/**
	 * Fires an event when a user clicks a question's help toggle during an analysis.
	 */
	function onShowHelp(){
		var data = {
			"projectId":projectId_,
			"questionId":questionId_,
			"taskId":taskId_
		};
		analytics.fireEvent("action.showHelp", data);
	}
	/**
	 * Fires an event when a user submits a task.
	 */
	function onSubmitTask(){
		var data = {
			"projectId":projectId_,
			"taskId":taskId_
		};
		analytics.fireEvent("action.submitTask", data);
	}
	/**
	 * Fires an event when a user skips a project tutorial.
	 */
	function onSkipTutorial(){
		var data = {
			"projectId":projectId_
		};
		submitEvent("action.skipTutorial", data);
	}
	/**
	 * Fires an event when a user completes a tutorial and starts contributing to a project.
	 */
	function onCompleteTutorial(){
		var data = {
			"projectId":projectId_
		};
		analytics.fireEvent("action.completeTutorial", data);
	}

	// Expose the API.
	geotagx.analytics = api_;
})(window.geotagx = window.geotagx || {}, jQuery);

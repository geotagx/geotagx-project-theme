/*
 * The GeoTag-X tutorial helper.
 */
;(function(geotagx, $, undefined){
	"use strict";

	var api_ = {}; // The tutorial API.
	var numberOfTutorials_ = 0; // The number of available tutorials.
	var currentTutorial_ = 0; // The index of the current tutorial.
	var assertions_ = null; // An object containing assertions about the image being analyzed.
	var nextQuestionKey_ = 0; // The next question's key.

	/**
	 * Begins the project tutorial.
	 * @param shortName the project's short name.
	 * @param tutorials an array of tutorials.
	 */
	api_.start = function(shortName, tutorials){
		if ($.type(shortName) !== "string"){
			console.log("[geotagx::project::start] Error! Invalid project slug.");
			return;
		}

		$(".show-on-task-loaded").removeClass("show-on-task-loaded").hide().fadeIn(200);
		$(".hide-on-task-loaded").hide();
		$("#questionnaire-rewind").on("click.tutorial", hideNotification);
		$("#tutorial-next-question").on("click.tutorial", function(){
			hideNotification(function(){ geotagx.questionnaire.showQuestion(nextQuestionKey_) });
		});
		$("#take-another-tutorial").on("click.tutorial", function(){
			currentTutorial_ = (currentTutorial_ + 1) % numberOfTutorials_;
			setTutorial(tutorials[currentTutorial_]);
			geotagx.questionnaire.start();
		});

		numberOfTutorials_ = tutorials.length;
		currentTutorial_ = Math.floor((Math.random() * numberOfTutorials_)); // Select a random tutorial out of all available ones.
		setTutorial(tutorials[currentTutorial_]);

		geotagx.questionnaire.onBeforeShowQuestion(beforeShowQuestion);
		geotagx.questionnaire.onShowNextQuestion(onShowNextQuestion);
		geotagx.questionnaire.start();
	};

	function setTutorial(tutorial){
		geotagx.questionnaire.setImage(tutorial.image, tutorial.image_source);
		assertions_ = tutorial.assertions;
	}
	/**
	 * Returns the key to the next question based on the specified answer to
	 * the question with the specified key. If the next question has been
	 * explicitly skipped, then it will return the first non-skipped question.
	 */
	function getNextQuestionKey(key, answer){
		var nextKey = geotagx.questionnaire.getNextQuestionKey(key, answer);
		var assertions = assertions_[nextKey];
		while (assertions && assertions.skip){
			nextKey = geotagx.questionnaire.getNextQuestionKey(nextKey, "Unknown");
			assertions = assertions_[nextKey];
		}
		return nextKey;
	}
	/**
	 * A method that is called before a new question is presented to the user.
	 * For tutorials, some questions will have to have their input fields
	 * auto-completed and this is where it's done.
	 */
	function beforeShowQuestion(key){
		var assertion = assertions_[key];
		if (assertion){
			var autoComplete = assertion.autocomplete;
			if (autoComplete){
				var selector = ".question[data-key='" + key + "'] .answer ";
				// When auto-complete is set to true, we need to fill the
				// input with the expected answer and trigger the 'Done' button.
				var $input = $(selector + "input");
				if ($input.length > 0){
					$input.val(assertion.expects);
					$input.prop("disabled", true);
					var $button = $(".question[data-key='" + key + "'] .answer button.btn-answer[value='Done']");
					if ($button.length > 0)
						$button.trigger("click");
				}
			}
		}
	}
	/**
	 * A user-defined method that displays the next question. This method
	 * prevents the questionnaire from automatically progressing to the next
	 * question. Instead, it validates the user's answer and if it matches with
	 * an expected expected, a notification containing a 'NEXT' button is
	 * displayed, thereby allowing the user to advance to the next question.
	 * If the answer does not match, a different kind of notification -- inviting
	 * the user to try again -- is displayed.
	 */
	function onShowNextQuestion(question, answer, $submitter){
		var assertion = assertions_[question];
		var message = assertion.default_message;
		var isExpectedAnswer = false;
		if ($.type(answer) === "string"){
			isExpectedAnswer = answer.toLowerCase() === assertion.expects.toLowerCase();

			var m = assertion.messages;
			message = m[answer] || m[answer.toLowerCase()] || m[answer.toUpperCase()] || message;
		}
		else
			isExpectedAnswer = answer === assertion.expects;

		if (isExpectedAnswer){
			nextQuestionKey_ = getNextQuestionKey(question, answer);
			geotagx.analytics.onCorrectTutorialAnswer();
		}
		else
			geotagx.analytics.onWrongTutorialAnswer();

		showNotification(message, isExpectedAnswer);
	}

	function showNotification(message, isExpected){
		var $box = $("#tutorial-message-box");

		$box.removeClass("hide").hide();
		if (isExpected){
			$box.addClass("expected");
			$("#tutorial-success-message").html(message);
		}
		else {
			$box.removeClass("expected");
			$("#tutorial-failure-message").html(message);
		}
		$box.fadeIn(250);
	}

	function hideNotification(onNotificationHidden){
		$("#tutorial-message-box").fadeOut(150, function(){
			$(this).addClass("hide");

			if (onNotificationHidden && $.type(onNotificationHidden) === "function")
				onNotificationHidden();
		})
	}

	// Expose the API.
	geotagx.tutorial = api_;
})(window.geotagx = window.geotagx || {}, jQuery);

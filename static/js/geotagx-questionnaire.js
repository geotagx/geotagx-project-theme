/*
 * The GeoTag-X questionnaire helper.
 */
;(function(geotagx, $, undefined){
	"use strict";

	var api_ = {}; // The questionnaire API.
	var answers_ = {}; // The questionnaire's answers.
	var image_ = null; // The image to analyze.
	var $questions_ = null; // The set of questions.
    var numberOfQuestions_ = 0; // The number of questions asked in this project, including the spam filter.
	var initialQuestionKey_ = null; // The key to the questionnaire's initial question.
    var progress_ = []; // A stack used to track the user's progress throughout the questionnaire. It also allows a user to rewind to a previous question.
	var controlFlow_ = null; // An object that contains the questionnaire's control flow.
	var beforeShowQuestion_ = function(){}; // A user-defined function that is called before a question is displayed.

	$(document).ready(function(){
		$questions_ = $(".question");
		numberOfQuestions_ = $questions_.length;
		initialQuestionKey_ = $questions_.first().data("key");

		initializeAnswers();
		initializeOpenLayers();
		initializeDisqus();
		initializeDatetimePickers();
		initializeImage();

		$(".btn-answer").on("click.questionnaire", onQuestionAnswered);
		$("#questionnaire-no-photo").on("click", onNoPhotoVisible);
		$("#questionnaire-rewind").on("click", showPreviousQuestion);
	});
	/**
	 * Initializes the answers object.
	 */
	function initializeAnswers(){
		answers_["photoVisible"] = true;

		// The object property names are stored as a data attribute in each
		// element with the 'answer' class.
		$(".answer").each(function(){
			var key = $.trim($(this).data("key"));
			if (key.length > 0)
				answers_[key] = null;
		});
	}
	/**
	 * Initializes any OpenLayers maps.
	 */
	function initializeOpenLayers(){
		// Maps can only be created iff the OpenLayers wrapper exists.
		if (!$.isEmptyObject(geotagx.ol)){
			// Initialize maps if any exist.
			$(".geotagx-ol-map").each(function(){
				var $map = $(this);
				var targetId = $.trim($map.attr("id"));
				if (targetId.length > 0)
					geotagx.ol.createMap(targetId, $.trim($map.data("location")));
			});
		}
	}
	/**
	 * Initialize Disqus.
	 */
	function initializeDisqus(){
		var $thread = $("#disqus_thread");
		var $showCommentsButton = $("#questionnaire-show-comments");
		var $hideCommentsButton = $("#questionnaire-hide-comments");

		// Lazy-initialize Disqus the first time the 'Show comments'
		// button is pressed.
		$showCommentsButton.one("click.questionnaire", function(){
			var disqus_shortname = "geotagx"; (function(){var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true; dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);})();
		}).on("click.questionnaire", function(){
			$(this).fadeOut(100, function(){
				$(this).addClass("hide");
				$hideCommentsButton.removeClass("hide").hide().fadeIn(150);
				$thread.removeClass("hide").hide().fadeIn(100);
			});
		});

		$hideCommentsButton.on("click.questionnaire", function(){
			$(this).fadeOut(100, function(){
				$(this).addClass("hide");
				$showCommentsButton.removeClass("hide").hide().fadeIn(150);
				$thread.fadeOut(100, function(){ $(this).addClass("hide"); });
			});
		});
	}
	/**
	 * Initialize date, time and datetime pickers, if any exist.
	 */
	function initializeDatetimePickers(){
		if ($.prototype.datetimepicker){
			var $datetimePickers = $(".datetime-picker");
			if ($datetimePickers.length > 0){
				$datetimePickers.datetimepicker({
					format:"YYYY/MM/DD HH:mm:ss",
					inline:true,
					sideBySide:true,
					icons:{
						up:"fa fa-2x fa-chevron-up",
						down:"fa fa-2x fa-chevron-down",
						next:"fa fa-chevron-right",
						previous:"fa fa-chevron-left"
					}
				});
			}
			var $datePickers = $(".date-picker");
			if ($datePickers.length > 0){
				$datePickers.datetimepicker({
					format:"YYYY-MM-DD",
					inline:true,
					icons:{
						next:"fa fa-chevron-right",
						previous:"fa fa-chevron-left"
					}
				});
			}
		}
	}
	/**
	 * Initialize the image.
	 */
	function initializeImage(){
		image_ = new geotagx.Image("image");

		$("#image-zoom-in").on("click.questionnaire", image_.zoomIn.bind(image_));
		$("#image-zoom-out").on("click.questionnaire", image_.zoomOut.bind(image_));
		$("#image-rotate-left").on("click.questionnaire", image_.rotateLeft.bind(image_));
		$("#image-rotate-right").on("click.questionnaire", image_.rotateRight.bind(image_));
	}
	/**
	 *
	 */
	function onQuestionAnswered(){
		var $submitter = $(this);
		var key = getCurrentQuestionKey();
		var answer = parseAnswer(getQuestionType(key), $submitter);

		saveAnswer(key, answer);
		showNextQuestion(key, answer);
	}
	/**
	 *
	 */
	function onNoPhotoVisible(){
		answers_.photoVisible = false;
		api_.finish();
	}
	/**
	 * Returns true if the specified question key is valid, false otherwise.
	 */
	function isValidQuestionKey(key){
		return $.type(key) === "string" && $.trim(key).length > 0 && (key === "end" || key in answers_);
	}
	/**
	 * Returns the previous question's key. If no previous question exists, null is returned.
	 */
	function getPreviousQuestionKey(){
		return progress_.length > 1 ? progress_[progress_.length - 2] : null;
	}
	/**
	 * Returns the current question's key. If no question exists, null is returned.
	 */
	function getCurrentQuestionKey(){
		return progress_.length > 0 ? progress_[progress_.length - 1] : null;
	}
	/**
	 * Returns the key to the question that succeeds the question with the specified
	 * key, and based on the answer. If there's no successor then null is returned.
	 * @param key the key to the question for which we wish to find a successor.
	 * @param answer an answer to the question with the specified key.
	 */
	function getNextQuestionKey(key, answer){
		var nextKey = null;

		if (controlFlow_ && key in controlFlow_){
			var branch = controlFlow_[key];
			var branchType = $.type(branch);
			if (branchType === "string")
				nextKey = $.trim(branch);
			else if (branchType === "object"){
				// Convert the answer to lower-case for a case-insensitive comparison.
				answer = $.trim(answer.toLowerCase());

				// Binary questions are a bit special: If the user clicks "No",
				// "I don't know" or "Image not clear", then this is considered a "No".
				if (getQuestionType(key) === "binary")
					answer = answer === "yes" ? "yes" : "no";

				// Get the question key based on the answer.
				if (answer in branch)
					nextKey = branch[answer];
			}
		}
		// If the next question could not be determined from the control flow,
		// then it is implied that the next question is the successor to the
		// question with the specified key.
		if (!isValidQuestionKey(nextKey)){
			var $node = getQuestionNode(key);
			if ($node)
				nextKey = $node.next().data("key") || null;
		}
		// If the key is null then there're no more questions to display, so
		// logically the end of the questionnaire has been reached.
		return nextKey || "end";
	}
	/**
	 * Displays the previous question, iff it exists.
	 */
	function showPreviousQuestion(){
		// We can only rewind if we've completed at least one question, which
		// means the progress stack contains at least two keys, one to the
		// current question and another to the previous.
        if (progress_.length > 1){
			// Hide the current question, and destroy its result.
			var current = getCurrentQuestionKey();
			hideQuestion(current);
			saveAnswer(current, null);
			progress_.pop();

			// Since the current question's key was removed from the progress
			// stack, the previous question is now the current question.
			var previous = getCurrentQuestionKey();
			var $node = getQuestionNode(previous);
			if ($node && $node.length > 0){
				beforeShowQuestion_(previous);
				$node.removeClass("hide").hide().fadeIn(300);
			}

            // Disable the rewind button and enable the 'no photo' button if
			// there're no more previous questions.
            if (progress_.length === 1){
                $("#questionnaire-rewind").prop("disabled", true);
				$("#questionnaire-no-photo").prop("disabled", false);
				answers_.photoVisible = true;
			}

			var i = $node.data("index");
			updateStatusPanel(progress_.length > 0 ? getPercentageComplete(i - 1) : 0); // Note that for the index i, we have completed (i - 1) questions.
			geotagx.analytics.onQuestionChanged(i);
        }
        else
            console.log("[geotagx::questionnaire::showPreviousQuestion] Error! Could not load the previous question!");
	}
	/**
	 * Displays the questions with the specified key, iff it exists.
	 * If the key is 'end', the the submission form is shown.
	 */
	function showQuestion(key){
		if (isValidQuestionKey(key)){
			var questionIndex = getQuestionIndex(key);

			// If at least one question has been answered, hide the current question
			// before moving onto the next.
			var hasAnsweredQuestion = progress_.length > 0;
			if (hasAnsweredQuestion)
				hideQuestion(getCurrentQuestionKey());

			$("#questionnaire-rewind").prop("disabled", !hasAnsweredQuestion);
			$("#questionnaire-no-photo").prop("disabled", hasAnsweredQuestion);

			progress_.push(key);

			if (key === "end")
				updateStatusPanel(100);
			else if (questionExists(key)){
				var $node = getQuestionNode(key);
				if ($node && $node.length > 0){
					beforeShowQuestion_(key);
					$node.removeClass("hide").hide().fadeIn(300, function(){
						var questionType = $node.data("type");
						if (questionType === "geotagging"){
							// If the question type is geotagging, we need to resize the
							// map viewport only when the question is made visible so
							// that the OpenLayers API uses the correct dimensions.
							var $map = $(".geotagx-ol-map", $node);
							if ($map.length > 0){
								var targetId = $map.attr("id");
								if (targetId){
									var map = geotagx.ol.findMap(targetId);
									if (map)
										map.updateSize();
								}
							}
						}
					});
				}
				updateStatusPanel(hasAnsweredQuestion ? getPercentageComplete(questionIndex - 1) : 0); // Note that for the index i, we have completed (i - 1) questions.
			}
			geotagx.analytics.onQuestionChanged(questionIndex);
		}
		else
			console.log("[geotagx::questionnaire::showQuestion] Error! Invalid question key '" + key + "'.");
	}
	/**
	 * Displays the next question based on the answer to the question with the
	 * specified key. This function can be overwritten with user-defined behavior
	 * via the onShowNextQuestion call.
	 * @param key the current question's key.
	 * @param answer the current question's answer.
	 */
	function showNextQuestion(key, answer){
		showQuestion(getNextQuestionKey(key, answer));
	}
	/**
	 * Hides the question with the specified key.
	 */
	function hideQuestion(key){
		var $node = getQuestionNode(key);
		if ($node && $node.length > 0)
			$node.addClass("hide");
	}
	/**
	 * Returns the answer submitted by the specified submitter.
	 */
	function parseAnswer(questionType, $submitter){
		/**
		 * Returns the value of an item.
		 */
		function getItemValue($item){
			var output = "";
			if ($item && $item.length > 0){
				// Does the item contain its value in a text input field? If it
				// does, then get the actual value from the text input field.
				var otherInputId = $.trim($item.data("other-input-id"));
				if (otherInputId.length > 0){
					var $otherInput = $("#" + otherInputId);
					if ($otherInput.length > 0){
						var value = $.trim($otherInput.val());
						output = "Other" + (value.length > 0 ? ("[" + value + "]") : "");
					}
				}
				else
					output = $.trim($item.val());
			}
			return output;
		}
		/**
		 * Converts a list of item values into a string.
		 */
		function itemValuesToString($items){
			var output = "";
			$items.each(function(){
				var value = getItemValue($(this));
				if (value.length > 0)
					output += ", " + value;
			});
			return output.substring(2); // Remove the leading comma and space.
		}

		var answer = $submitter.attr("value");
		if (answer === "Done"){
			switch (questionType){
				case "dropdown-list":
					// Find the selected item that isn't disabled. Remember that
					// the prompt is selected by default, but disabled to prevent
					// users from ever selecting it.
					var $input = $("#" + $submitter.data("input-id"));
					var $item = $(":checked:not(:disabled)", $input);
					return $item.length > 0 ? $.trim($item.val()) : "None";
				case "select":
					var $item = $("input:checked", $submitter.siblings("label"));
					var value = getItemValue($item);
					return value.length > 0 ? value : "None";
				case "checklist":
					var $checkedItems = $("input:checked", $submitter.siblings("label"));
					var value = itemValuesToString($checkedItems);
					return value.length > 0 ? value : "None";
				case "illustrative-checklist":
					var $illustrations = $(".illustration", $submitter.siblings(".illustrations"));
					var $input = $("input[type='checkbox']:checked", $illustrations);
					var other = $.trim($("input[type='text']", $illustrations).val()); // The user's unlisted answer.
					if (other.length > 0)
						other = "Other[" + other + "]";
					answer = other;
					return answer
					     ? ($input.length === 0 ? answer : answer + ", " + itemValuesToString($input))
					     : ($input.length === 0 ? "None" : itemValuesToString($input));
				case "geotagging":
					var coordinates = null;
					var targetId = $submitter.data("target-id");
					if (targetId){
						var map = geotagx.ol.findMap(targetId);
						if (map)
							coordinates = map.getSelection();
					}
					return coordinates;
				case "url":
				case "text":
				case "longtext":
					return $.trim($("#" + $submitter.data("input-id")).val());
				case "number":
					var numberString = $.trim($("#" + $submitter.data("input-id")).val());
					return numberString ? parseFloat(numberString) : null;
				case "datetime":
					var datetime = $("#" + $submitter.data("input-id")).data("DateTimePicker").date();
					return datetime != null ? datetime.format("X") : null; // Return date and time as a Unix timestamp.
				case "date":
					var date = $("#" + $submitter.data("input-id")).data("DateTimePicker").date();
					return date != null ? date.format("YYYY-MM-DD") : null;
				default:
					console.log("[geotagx::questionnaire::parseAnswer] Error! Unknown question type '" + questionType + "'.");
					return null;
			}
		}
		else
			return answer;
	}
	/**
	 * Saves the specified answer.
	 * @param key the name of the key used to store the answer.
	 * @param answer the answer to save.
	 */
	function saveAnswer(key, answer){
		if (isValidQuestionKey(key) && key !== "end")
			answers_[key] = $.type(answer) === "undefined" ? null : answer;
	};
	/**
	 * Returns true if a question with the specified key exists, false otherwise.
	 */
	function questionExists(key){
		// The answers object contains a reference for each question key
		// with a value that was input by the user. As such, if the key we're
		// looking for is part of this object, the question exists.
		return key in answers_;
	}
	/**
	 * Returns the HTML node of the question with the specified key.
	 */
	function getQuestionNode(key){
		return questionExists(key) ? $(".question[data-key='" + key + "']") : null;
	}
	/**
	 * Returns the type of the question with the specified key.
	 */
	function getQuestionType(key){
		return key === "end" ? null : getQuestionNode(key).data("type");
	}
	/**
	 * Returns the index of the question with the specified key.
	 */
	function getQuestionIndex(key){
		return key === "end" ? -1 : getQuestionNode(key).data("index");
	}
	/**
	 * Returns the current question's HTML node.
	 */
	function getCurrentQuestionNode(){
		var node = null;
		var key = getCurrentQuestionKey();
		if (key)
			node = getQuestionNode(key);

		return node;
	}
	/**
	 * Resets all user input.
	 */
	function resetInput(){
		$("textarea").val("");
		$("input").removeAttr("checked");
		$("input[type='text']").val("");
		$("input[type='url']").val("");
		$("input[type='number']").val("");
		$("select > option:eq(0)").prop("selected", true);
		$([".datetime-picker", ".date-picker"]).each(function(){
			var $picker = $(this);
			if ($picker.length > 0 && $picker.data("DateTimePicker"))
				$picker.data("DateTimePicker").clear();
		});
		geotagx.ol.resetAllMaps();
	}
	/**
	 * Returns the percentage complete based on the specified question index.
	 */
	function getPercentageComplete(index){
		return Math.max(0, Math.min(100, ((index / numberOfQuestions_) * 100).toFixed(0)));
	}
	/**
	 * Updates the status panel. If the user has reached 100%, then a submit
	 * button is displayed.
	 */
	function updateStatusPanel(percentageComplete){
		if (percentageComplete === 100){
			$("#current-analysis-progress").html(100);
			$("#questionnaire-progress-bar").css("width", "100%");
			$("#questionnaire-status-panel").addClass("analysis-complete");
		}
		else {
			$("#current-analysis-progress").html(percentageComplete);
			$("#questionnaire-progress-bar").css("width", percentageComplete + "%");
			$("#questionnaire-status-panel").removeClass("analysis-complete");
		}
	}
	/**
	 * Starts the questionnaire from the question with the specified key.
	 * If no key is specified, then the initial question is determined automatically.
	 */
	api_.start = function(key){
		$questions_.addClass("hide");

		resetInput();
		progress_ = [];

		// Enable "Show Comments" toggle.
		$("#questionnaire-show-comments").prop("disabled", false);

		// Reset the current task run.
		for (var property in answers_)
			answers_[property] = null;

		// Override the initial question identifier, if need be.
		// Remember that it is initially determined in the 'ready' event handler.
		if (isValidQuestionKey(key))
			initialQuestionKey_ = key;

		api_.showQuestion(initialQuestionKey_);

		// Start a questionnaire tour, if one hasn't already been completed.
		if (!geotagx.tour.questionnaireTourEnded())
			setTimeout(geotagx.tour.startQuestionnaireTour, 1000);
	};
	/**
	 * Ends the questionnaire.
	 */
	api_.finish = function(){
		api_.showQuestion("end");
	};
	/**
	 * Sets the questionnaire's control flow.
	 * The control flow maps a question key to an object that itself maps an
	 * answer to another question key. This allows the questionnaire to branch
	 * to a specific question based on an answer to the current question.
	 */
	api_.setControlFlow = function(controlFlow){
		controlFlow_ = controlFlow;
	};
	/**
	 * Sets the image to analyze.
	 * @param imageUrl the direct link to the image.
	 * @param imageSource the link to the page where the image was found.
	 */
	api_.setImage = function(imageUrl, imageSource){
		image_.setSource(imageUrl);
		$("#image-source").attr("href", imageSource);
	};
	/**
	 * Returns the key to the next question based on the specified answer to the
	 * question with the specified key.
	 */
	api_.getNextQuestionKey = function(key, answer){
		return getNextQuestionKey($.trim(key), answer);
	};
	/**
	 * Returns the number of questions.
	 */
	api_.getNumberOfQuestions = function(){
		return numberOfQuestions_;
	};
	/**
	 * Returns the type of the question with the specified key.
	 */
	api_.getQuestionType = function(key){
		return getQuestionType($.trim(key));
	};
	/**
	 * Returns the current answer for the question with the specified key.
	 */
	api_.getAnswer = function(key){
		var answer = null;
		if (questionExists(key))
			answer = answers_[key];
		else
			console.log("[geotagx::questionnaire::getAnswer] Warning! Could not find a storage key for the question with the key '" + key + "'.");

		return answer;
	};
	/**
	 * Returns the current set of answers.
	 */
	api_.getAnswers = function(){
		return answers_;
	};
	/**
	 * Returns the current question's key.
	 */
	api_.getCurrentQuestionKey = getCurrentQuestionKey;
	/**
	 * Set a user-defined function that displays the next question.
	 * @param hanlder a user-defined function that displays the next question.
	 */
	api_.onShowNextQuestion = function(handler){
		if (handler && $.type(handler) === "function")
			showNextQuestion = handler;
	};
	/**
	 * Displays the previous question.
	 */
	api_.showPreviousQuestion = showPreviousQuestion;
	/**
	 * Displays the question with the specified key.
	 * Note that if the key is 'end', then the questionnaire is considered
	 * complete, at which point a submit button is displayed.
	 * @param key a string used to identify a question.
	 */
	api_.showQuestion = function(key){
		showQuestion($.trim(key));
	};
	/**
	 * Displays the next question based on the answer to the question with the
	 * specified key.
	 */
	api_.showNextQuestion = function(key, answer){
		showNextQuestion($.trim(key), answer);
	};
	/**
	 * Set a user-defined function that is called before a new question is displayed.
	 * @param handler a user-defined function that is called before a new question is displayed.
	 */
	api_.onBeforeShowQuestion = function(handler){
		beforeShowQuestion_ = $.type(handler) === "function" ? handler : function(){};
	};

	// Expose the questionnaire API.
	geotagx.questionnaire = api_;
})(window.geotagx = window.geotagx || {}, jQuery);

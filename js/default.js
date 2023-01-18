(() => {
	// Main data object for processing and then saving to localStorage
	let data = {};

	// Keep track of last ID when needing to create new comment entries
	let lastId = 0;

	/* --- Transitions --- */

	function onAnimationEnd_add(e) {
		e.target.classList.remove('fade-in');
	}

	function onAnimationEnd_remove(e, commentsContainer) {
		e.target.classList.remove('fade-out');
		e.target.remove();
		if (commentsContainer.children.length === 0)
			commentsContainer.remove();
	}

	/* --- Comment - Add (Shown at bottom of page) --- */

	function onClickSend(e) {
		e.preventDefault();

		// Increment the last ID since a new posting has been made
		lastId++;

		// Remove the reply-to @username from the comment text for saving
		const commentText = e.target.parentNode.querySelector('.reply-text');

		// New comment data
		const commentData = {
			'id': lastId,
			'content': commentText.value.trim(),
			'createdAt': Date.now(),
			'score': 0,
			'user': {
				'image': {
					'png': data.currentUser.image.png,
					'webp': data.currentUser.image.webp
				},
				'username': data.currentUser.username
			},
			'replies': []
		};

		// Generate comment with new comment data
		const comment = generateComment(commentData);
		document.querySelector('.comments').appendChild(comment);

		// Push new comment data to localStorage
		data.comments.push(commentData);
		saveData(data);

		// Clear the textarea field after processing
		commentText.value = '';
	}

	/* --- Comment - Edit --- */

	function onSubmitEdit(e) {
		e.preventDefault();

		let commentText = e.target.querySelector('.reply-text').value.trim();
		if (commentText.charAt(0) === '@') {
			commentText = commentText.substr(commentText.indexOf(' ') + 1);
		}

		// Remove comment from localStorage
		let matchFound = false;
		let replyingTo = '';
		const commentId = parseInt(e.target.parentNode.id.split('-')[1]);

		for (const comment in data.comments) {
			// Matching comment ID found that score control is in?
			if (data.comments[comment].id === commentId) {
				matchFound = true;
				data.comments[comment].content = commentText;
				break;
			}

			for (const reply in data.comments[comment].replies) {
				if (data.comments[comment].replies[reply].id === commentId) {
					matchFound = true;
					data.comments[comment].replies[reply].content = commentText;
					replyingTo = data.comments[comment].replies[reply].replyingTo;
					break;
				}
			}

			if (matchFound) break;
		}

		const commentsContainer = e.target.parentNode;

		commentsContainer.querySelector('.edit-form').remove();

		// Comment text
		const newCommentText = document.createElement('p');
		if (replyingTo !== '') {
			commentText = `<span class="replyto-username">@${replyingTo}</span>, ${commentText}`;
		}
		newCommentText.innerHTML = commentText;
		newCommentText.className = 'comment-text';

		const likesContainer = commentsContainer.querySelector('.comment-likes-container');
		commentsContainer.insertBefore(newCommentText, likesContainer);

		saveData(data);
	}

	function onClickEdit(e) {
		const currentComment = e.target.parentNode.parentNode;

		const commentText = currentComment.querySelector('.comment-text');
		commentText.remove();

		const editForm = document.createElement('form');
		editForm.className = 'edit-form';
		editForm.setAttribute('action', '#');
		editForm.setAttribute('method', 'post');
		editForm.addEventListener('submit', onSubmitEdit, false);

		// Comment heading title
		const headingTitle = document.createElement('h2');
		headingTitle.className = 'sr-only';
		headingTitle.innerText = 'Edit Comment';
		editForm.appendChild(headingTitle);

		const commentTextInput = document.createElement('textarea');
		commentTextInput.className = 'reply-text';
		commentTextInput.setAttribute('rows', '3');
		commentTextInput.value = commentText.innerText.trim();
		editForm.appendChild(commentTextInput);

		const updateButton = document.createElement('button');
		updateButton.className = 'update-button';
		updateButton.innerText = 'Update';
		editForm.appendChild(updateButton);

		currentComment.appendChild(editForm);
	}

	/* --- Modal - Delete Comment --- */

	function onClickDeleteConfirmed(e) {
		const currentComment = e.target.parentNode.parentNode;
		const currentCommentId = parseInt(currentComment.id.split('-')[1]);
		const commentsContainer = currentComment.parentNode;

		// Remove comment from DOM
		currentComment.classList.add('fade-out');
		currentComment.addEventListener('animationend', (e) => {
			onAnimationEnd_remove(e, commentsContainer);
		}, false);

		// Remove comment from localStorage
		let matchFound = false;

		for (const comment in data.comments) {
			// Matching comment ID found that score control is in?
			if (data.comments[comment].id === currentCommentId) {
				matchFound = true;
				data.comments.splice(comment, 1);
				break;
			}

			for (const reply in data.comments[comment].replies) {
				if (data.comments[comment].replies[reply].id === currentCommentId) {
					matchFound = true;
					data.comments[comment].replies.splice(reply, 1);
					break;
				}
			}

			if (matchFound) break;
		}

		saveData(data);
	}

	function onClickDelete(e) {
		// Prevent the body in the background from scrolling while modal is visible
		document.body.style = 'overflow: hidden;';

		// Make modal visible
		const modalConfirmDelete = document.getElementById('modal-confirm-delete');
		modalConfirmDelete.classList.remove('hidden');
		modalConfirmDelete.setAttribute('aria-hidden', 'false');

		// Add events for modal buttons
		modalConfirmDelete.querySelector('.confirm-button').addEventListener('click', () => {
			modalConfirmDelete.classList.add('hidden');
			modalConfirmDelete.setAttribute('aria-hidden', 'true');
			document.body.style = '';
			onClickDeleteConfirmed(e);
		});
		modalConfirmDelete.querySelector('.cancel-button').addEventListener('click', () => {
			modalConfirmDelete.classList.add('hidden');
			modalConfirmDelete.setAttribute('aria-hidden', 'true');
			document.body.style = '';
		});
	}

	/* --- Comment - Likes --- */

	function onClickUpdateScore(commentId, isIncreased) {
		const inputLikes = document.getElementById('likes-' + commentId);
		console.log(commentId);

		let matchFound = false;

		for (const comment in data.comments) {
			// Matching comment ID found that score control is in?
			if (data.comments[comment].id === commentId) {
				matchFound = true;
				if (isIncreased)
					data.comments[comment].score++;
				else
					data.comments[comment].score--;
				break;
			}

			for (const reply in data.comments[comment].replies) {
				if (data.comments[comment].replies[reply].id === commentId) {
					matchFound = true;
					if (isIncreased)
						data.comments[comment].replies[reply].score++;
					else
						data.comments[comment].replies[reply].score--;
					break;
				}
			}

			if (matchFound) break;
		}

		saveData(data);

		if (isIncreased)
			inputLikes.value = parseInt(inputLikes.value) + 1;
		else
			inputLikes.value = parseInt(inputLikes.value) - 1;
	}

	/* --- Comment - Reply --- */

	function onSubmitReply(e) {
		e.preventDefault();

		// Increment the last ID since a new posting has been made
		lastId++;

		// Remove the reply-to @username from the comment text for saving
		let commentText = e.target.querySelector('.reply-text').value.trim();
		commentText = commentText.substr(commentText.indexOf(' ') + 1);

		// New comment data
		const commentData = {
			'id': lastId,
			'content': commentText,
			'createdAt': Date.now(),
			'score': 0,
			'replyingTo': e.target.parentNode.previousSibling.querySelector('.comment-username').innerText,
			'user': {
				'image': {
					'png': data.currentUser.image.png,
					'webp': data.currentUser.image.webp
				},
				'username': data.currentUser.username
			}
		};

		// Get ID of comment you're replying to
		let commentId = parseInt(e.target.parentNode.previousSibling.id.split('-')[1]);

		// Generate comment with new comment data
		const comment = generateComment(commentData);

		if (data.comments[commentId-1].replies.length === 0) {
			// If comment has no replies, create a new replies container
			const repliesContainer = document.createElement('div');
			repliesContainer.className = 'replies';
			repliesContainer.appendChild(comment);
			const currentNode = e.target.parentNode;
			currentNode.parentNode.insertBefore(repliesContainer, currentNode.nextSibling);
		} else {
			// Otherwise, get existing container based on ID
			const repliesContainer = document.querySelector('#replies-' + commentId);
			repliesContainer.appendChild(comment);
			const currentNode = e.target.parentNode;
			currentNode.parentNode.insertBefore(repliesContainer, currentNode.nextSibling);
		}

		// Push new comment data to localStorage
		data.comments[commentId-1].replies.push(commentData);
		saveData(data);

		//currentNode.parentNode.insertBefore(comment, currentNode.nextSibling);

		e.target.parentNode.remove();
	}

	function onClickReply(e) {
		const data = loadData();

		// Reply container
		const reply = document.createElement('div');
		reply.classList.add('reply', 'fade-in');
		reply.addEventListener('animationend', onAnimationEnd_add, false);
		//reply.className = 'reply';

		// Comment heading title
		const headingTitle = document.createElement('h3');
		headingTitle.className = 'sr-only';
		headingTitle.innerText = 'Reply to User';
		reply.appendChild(headingTitle);

		// Reply form
		const replyForm = document.createElement('form');
		replyForm.className = 'reply-form';
		replyForm.setAttribute('action', '#');
		replyForm.setAttribute('method', 'post');
		replyForm.addEventListener('submit', onSubmitReply, false);

		// User avatar picture
		const avatar = document.createElement('img');
		avatar.src = data.currentUser.image.png;
		avatar.alt = '';
		avatar.width = '64';
		avatar.height = '64';
		avatar.className = 'reply-avatar';
		replyForm.appendChild(avatar);

		// Reply text input
		const replyText = document.createElement('textarea');
		replyText.className = 'reply-text';
		replyText.setAttribute('rows', '3');
		replyText.value = '';
		replyForm.appendChild(replyText);

		// Reply submit button
		const replyButton = document.createElement('button');
		replyButton.className = 'reply-button';
		replyButton.innerText = 'Reply';
		replyForm.appendChild(replyButton);

		// Append generated reply content to reply container
		reply.appendChild(replyForm);

		// Get DOM position after current comment container and insert new reply content
		const currentNode = e.target.parentNode.parentNode;
		currentNode.parentNode.insertBefore(reply, currentNode.nextSibling);

		// Get reply-to username and add it into the text input
		const replyToUsername = currentNode.parentNode.querySelector('.comment-username').innerText;
		replyText.value = `@${replyToUsername}, `;
		replyText.focus();
	}

	/* --- Comments --- */

	function generateComment(dataItem) {
		// Comment container
		const comment = document.createElement('article');
		comment.id = 'comment-' + dataItem.id;
		comment.classList.add('comment', 'fade-in');
		comment.addEventListener('animationend', onAnimationEnd_add, false);
		{
			const dataId = parseInt(dataItem.id);
			if (dataId > lastId)
				lastId = dataId;
		}

		// Comment heading title
		const headingTitle = document.createElement('h3');
		headingTitle.className = 'sr-only';
		headingTitle.innerText = 'User Comment';
		comment.appendChild(headingTitle);

		// Comment header
		const header = document.createElement('div');
		header.className = 'comment-header';

		// User avatar picture
		const avatar = document.createElement('img');
		avatar.src = dataItem.user.image.png;
		avatar.alt = '';
		avatar.width = '64';
		avatar.height = '64';
		avatar.className = 'comment-avatar';
		header.appendChild(avatar);

		// Username
		const username = document.createElement('p');
		username.innerText = dataItem.user.username;
		username.className = 'comment-username';
		header.appendChild(username);

		// Comment username same as logged in username
		if (dataItem.user.username === data.currentUser.username) {
			// "YOU" tag
			const youTag = document.createElement('p');
			youTag.innerText = 'you';
			youTag.className = 'comment-you-tag';
			header.appendChild(youTag);
		}

		// Posted date
		const postedDate = document.createElement('p');
		const date = new Date(parseInt(dataItem.createdAt));
		postedDate.innerText = date.toLocaleDateString('en-US');
		postedDate.className = 'comment-posted';
		header.appendChild(postedDate);

		// Header content generated. Append it to comment.
		comment.appendChild(header);

		// Comment text
		const commentText = document.createElement('p');
		let replyToText = '';
		if (dataItem.replyingTo !== undefined) {
			replyToText = `<span class="replyto-username">@${dataItem.replyingTo}</span> `;
		}
		commentText.innerHTML = replyToText + dataItem.content;
		commentText.className = 'comment-text';
		comment.appendChild(commentText);

		// Likes +/- container
		const likesContainer = document.createElement('div');
		likesContainer.className = 'comment-likes-container';

		// Likes '+' button
		const likesAdd = document.createElement('button');
		likesAdd.classList.add('comment-likes-button', 'comment-likes-button-plus');
		likesAdd.innerHTML = '&plus;';
		likesAdd.addEventListener('click', () => {
			onClickUpdateScore(dataItem.id, true);
		}, false);
		likesContainer.appendChild(likesAdd);

		// Number of likes
		const likesInput = document.createElement('input');
		likesInput.id = 'likes-' + dataItem.id;
		likesInput.className = 'comment-likes';
		likesInput.setAttribute('type', 'number');
		likesInput.setAttribute('min', '0');
		likesInput.setAttribute('step', '1');
		likesInput.setAttribute('readonly', 'readonly');
		likesInput.value = dataItem.score;
		likesContainer.appendChild(likesInput);

		// Accessibility label for likes number input
		const likesInputLabel = document.createElement('label');
		likesInputLabel.className = 'sr-only';
		likesInputLabel.innerText = 'Comment Likes';
		likesInputLabel.setAttribute('for', likesInput.id);
		likesContainer.appendChild(likesInputLabel);

		// Likes '-' button
		const likesSubtract = document.createElement('button');
		likesSubtract.classList.add('comment-likes-button', 'comment-likes-button-minus');
		likesSubtract.innerHTML = '&ndash;';
		likesSubtract.addEventListener('click', () => {
			onClickUpdateScore(dataItem.id, false);
		}, false);
		likesContainer.appendChild(likesSubtract);

		// Custom number input content generated. Append it to comment.
		comment.appendChild(likesContainer);

		// Custom actions
		const actionsContainer = document.createElement('div');
		actionsContainer.className = 'comment-actions';

		// Comment username same as logged in username
		// Add user actions for own comments
		if (dataItem.user.username === data.currentUser.username) {
			// Custom action - Delete
			const actionDelete = document.createElement('button');
			actionDelete.classList.add('action-button', 'action-delete');
			actionDelete.innerText = 'Delete';
			actionDelete.addEventListener('click', onClickDelete, false);
			actionsContainer.appendChild(actionDelete);

			// Custom action - Edit
			const actionEdit = document.createElement('button');
			actionEdit.classList.add('action-button', 'action-edit');
			actionEdit.innerText = 'Edit';
			actionEdit.addEventListener('click', onClickEdit, false);
			actionsContainer.appendChild(actionEdit);
		} else {
			// Custom action - Reply
			const actionReply = document.createElement('button');
			actionReply.classList.add('action-button', 'action-reply');
			actionReply.innerText = 'Reply';
			actionReply.addEventListener('click', onClickReply, false);
			actionsContainer.appendChild(actionReply);
		}

		// Custom action content generated. Append it to comment.
		comment.appendChild(actionsContainer);

		// Finally, return the generated comment
		return comment;
	}

	function renderComments() {
		if (data === undefined)
			data = loadData();

		const commentsContainer = document.querySelector('.comments');

		for (const comment in data.comments) {
			commentsContainer.appendChild(generateComment(data.comments[comment]));

			if (data.comments[comment].replies.length > 0) {
				const repliesContainer = document.createElement('div');
				repliesContainer.id = 'replies-' + data.comments[comment].id;
				repliesContainer.className = 'replies';

				// Heading title
				const headingTitle = document.createElement('h2');
				headingTitle.className = 'sr-only';
				headingTitle.innerText = 'User Replies';
				repliesContainer.appendChild(headingTitle);

				for (const reply in data.comments[comment].replies) {
					repliesContainer.appendChild(generateComment(data.comments[comment].replies[reply]));
				}

				commentsContainer.appendChild(repliesContainer);
			}
		}
	}

	/* --- Data Functions --- */

	function loadJSON() {
		fetch('data.json')
			.then((response) => response.json())
			.then((json) => {
				localStorage.setItem('interactive-comments-section', JSON.stringify(json));
				data = json;
				renderComments();
			});
	}

	function loadData() {
		return JSON.parse(localStorage.getItem('interactive-comments-section'));
	}

	function saveData(data) {
		localStorage.setItem('interactive-comments-section', JSON.stringify(data));
	}

	/* --- Init --- */

	//localStorage.clear();  // Clear persistent data for testing

	document.getElementById('send-button')
		.addEventListener('click', onClickSend, false);

	// If data doesn't exist in localStorage, load it.
	if (!localStorage.getItem('interactive-comments-section')) {
		loadJSON();
	} else {
		data = loadData();
		renderComments();
	}
})();
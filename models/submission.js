var Promise = require('bluebird');
var config = require('../config');
var db = require('../lib/db');
var log = require('../lib/logger');

exports.create = function(user_id, conversation_id, options)
{
	options || (options = {});

	var submission = {
		user_id: user_id,
		conversation_id: conversation_id,
		created: db.now()
	};

	return db.create('submissions', submission);
};

exports.update = function(submission_id, data)
{
	return db.update('submissions', submission_id, data);
};

exports.get_by_form_stuffer_reference = function(form_stuffer_reference)
{
	return db.one('SELECT * FROM submissions WHERE form_stuffer_reference = {{form_stuffer_reference}} LIMIT 1', {form_stuffer_reference: form_stuffer_reference});
};

exports.update_from_receipt = function(receipt) {
	if (!receipt.uid) {
		log.error('submission: No UID specified in receipt', receipt);
		return Promise.reject('No UID specified in receipt')
	}
	return exports.get_by_form_stuffer_reference(receipt.uid)
		.then(function(submission) {
			var data = {
				form_stuffer_response: receipt,
				status: receipt.status ? receipt.status : 'failure',
				form_stuffer_log_id: receipt.reference ? receipt.reference : null,
				ended: db.now()
			};
			return exports.update(submission.id, data);
		});
}
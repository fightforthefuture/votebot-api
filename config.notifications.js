module.exports = [
    {
        type: 'gotv_and_sharing',
        process: function(user, callback) {
            console.log('    - Executing gotv_and_sharing for user: ', user.id);
            return callback({});
        }
    },
    {
        type: 'sharing_test_1',
        process: function(user, callback) {
            console.log('    - Executing sharing_test_1 for user: ', user.id);
            return callback({
                mark_sent: true
            });
        }
    }
];


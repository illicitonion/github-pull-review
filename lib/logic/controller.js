"use strict";
var Promise = require("bluebird");
var actions = require("./actions");

function Controller(dispatcher, httpApi) {
    this.dispatcher = dispatcher;
    this.httpApi = httpApi;
}

Controller.prototype.init = function() {
    this.dispatcher.register(this.onAction.bind(this));
}

Controller.prototype.onAction = function(payload) {
    switch (payload.action) {
        case "view_pr":
            this._view_pr(payload.data);
            break;
        case "token_update":
            this.httpApi.setAccessToken(payload.data.token);
            break;
        case "post_comment":
            this._post_comment(payload.data);
            break;
    }
};

Controller.prototype._post_comment = function(data) {
    var self = this;
    this.httpApi.postComment(
        data.repo_id, data.request_id, data.text
    ).finally(function() {
        self.dispatcher.dispatch(
            actions.create("post_comment_response", {
                comment_id: data.comment_id,
                response: "",
                is_error: false
            })
        );
        self.dispatcher.dispatch(actions.create("view_pr", {
            repo_id: data.repo_id,
            request_id: data.request_id
        }));
    });
};

Controller.prototype._view_pr = function(data) {
    var self = this;
    Promise.try(function() {
        return [
            self.httpApi.getPullRequest(data.repo_id, data.request_id),
            self.httpApi.getPullRequestComments(data.repo_id, data.request_id)
        ];
    }).spread(function(apiData, apiComments) {
        var body = apiData.body;
        console.log(JSON.stringify(body, undefined, 2));

        var mergeObj = {};
        if (body.merged) {
            mergeObj.by = body.merged_by.login;
            mergeObj.by_url = body.merged_by.html_url;
        }

        var comments = apiComments.body.map(function(apiComment) {
            return {
                body: apiComment.body,
                by: apiComment.user.login,
                by_url: apiComment.user.html_url,
                ts: new Date(apiComment.created_at),
                avatar: apiComment.user.avatar_url
            };
        });

        if (body.body) {
            // PR has a starting comment; wodge with the rest
            comments.unshift({
                body: body.body,
                by: body.user.login,
                by_url: body.user.html_url,
                ts: new Date(body.created_at),
                avatar: body.user.avatar_url
            });
        }

        var info = {
            owner_repo: data.repo_id,
            id: data.request_id,
            html_link: body.html_url,
            title: body.title,
            num_commits: body.commits,
            src_repo: body.head.label,
            dst_repo: body.base.label,
            owner: body.user.login,
            owner_url: body.user.html_url,
            state: body.merged ? "merged" : body.state.toLowerCase(),
            comments: comments,
            merged: mergeObj
        };
        self.dispatcher.dispatch(actions.create("pr_info", info));
    }, function(err) {
        console.error(err);
    });
};

module.exports = Controller;
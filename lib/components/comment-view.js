"use strict";
var LineComment = require("../logic/models/line-comment");

module.exports = React.createClass({displayName: 'CommentView',

    _emitDiff: function(direction) {

    },

    onPrevDiffs: function() {
        this._emitDiff("prev");
    },

    onNextDiffs: function() {
        this._emitDiff("next");
    },

    render: function() {
        var comment = this.props.comment;
        if (!comment) {
            return (
                <div>
                    No comment.
                </div>
            );
        }
        var lineCommentHeader;
        if (comment instanceof LineComment) {
            lineCommentHeader = (
                <span>
                    ({comment.getShortSha()})
                    <button onClick={this.onPrevDiffs}>Prev diffs</button>
                    <button onClick={this.onNextDiffs}>Next diffs</button>
                </span>
            );
            comment = comment.getComment();
        }

        var htmlBody = comment.getHtmlBody();

        if (/<\/blockquote>$/.test(htmlBody)) {
            // TODO ends in a block quote, hide it behind a toggle button.
        }

        return (
            <div className="CommentView">
                <img className="CommentView_avatar" src={
                    comment.getUser().getAvatarUrl()
                } />
                <div className="CommentView_header">
                    {comment.getUser().getUserLinkJsx()} commented {
                        comment.getTimeAgo()
                    } ago <a href={comment.getLink()} target="_blank">(Source)</a>
                    {lineCommentHeader}
                </div>
                <div className="CommentView_body"
                    dangerouslySetInnerHTML={{__html: htmlBody}}>
                </div>
            </div>
        );
    }
});
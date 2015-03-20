from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponseForbidden, HttpResponseBadRequest, HttpResponse
from django.views.generic import DetailView
import reversion
from judge.models import Comment, CommentVote

__all__ = ['upvote_comment', 'downvote_comment', 'CommentHistory']


@login_required
def vote_comment(request, delta):
    assert abs(delta) == 1

    if request.method != 'POST':
        return HttpResponseForbidden()

    if 'id' not in request.POST:
        return HttpResponseBadRequest()

    comment = Comment.objects.get(id=request.POST['id'])

    vote = CommentVote()
    vote.comment = comment
    vote.voter = request.user.profile
    vote.score = delta

    try:
        vote.save()
    except IntegrityError:
        vote = CommentVote.objects.get(comment=comment, voter=request.user.profile)
        if -vote.score == delta:
            comment.score -= vote.score
            comment.save()
            vote.delete()
        else:
            return HttpResponseBadRequest('You already voted.', mimetype='text/plain')
    else:
        comment.score += delta
        comment.save()
    return HttpResponse('success', mimetype='text/plain')


def upvote_comment(request):
    return vote_comment(request, 1)


def downvote_comment(request):
    return vote_comment(request, -1)


class CommentHistory(DetailView):
    model = Comment
    pk_url_kwarg = 'id'
    template_name = 'comment_history.jade'
    context_object_name = 'comment'

    def get_context_data(self, **kwargs):
        context = super(CommentHistory, self).get_context_data(**kwargs)
        context['revisions'] = reversion.get_for_object(self.object)
        return context

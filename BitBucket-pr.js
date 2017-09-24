/*jshint esversion: 6 */

const config = {
  color: '#225159'
};

const showLinks = {
  decline: true,
  approve: true,
  merge: true,
  commits: true,
  comments: true
};

const showNotifications = {
  push: true,
  fork: true,
  comment: true,
  pullrequest_created: true,
  pullrequest_rejected: true,
  pullrequest_approved: true,
  pullrequest_unapproved: true,
  pullrequest_fulfilled: true,
  pullrequest_updated: true,
  pullrequest_comment_created: true,
  pullrequest_comment_deleted: true,
  pullrequest_comment_updated: true
};

function get_basic_info(request) {
  const repository = {
    name: request.content.repository.name,
    link: 'https://sources.byzaneo.com/projects/'+request.content.repository.project.key+'/repos/'+request.content.repository.name+'/',
  };
  const author = {
    displayname: request.content.actor.displayName,
    link: repository.link, //'https://sources.byzaneo.com/users/'+request.content.actor.name,
    avatar: 'https://sources.byzaneo.com/users/'+request.content.actor.name+'/avatar.png?s=16'
  };
  return {
    author: author,
    repository: repository
  };
}

function get_basic_pr_info(request) {
  const repository = {
    name: request.content.pullRequest.fromRef.repository.name,
    link: 'https://sources.byzaneo.com/projects/'+request.content.pullRequest.fromRef.repository.project.key+'/repos/'+request.content.pullRequest.fromRef.repository.name+'/'
  };
  const author = {
    displayname: request.content.actor.displayName,
    link: repository.link, //'https://sources.byzaneo.com/users/'+request.content.actor.name,
    avatar: 'https://sources.byzaneo.com/users/'+request.content.actor.name+'/avatar.png?s=16'
  };
  return {
    author: author,
    repository: repository
  };
}

function get_pr_info(request) {
  const pullrequest = {
      sourcerepo: request.content.pullRequest.fromRef.repository.name,
      sourcebranch: request.content.pullRequest.fromRef.displayId,
      destinationrepo: request.content.pullRequest.toRef.repository.name,
      destinationbranch: request.content.pullRequest.toRef.displayId,
      id: request.content.pullRequest.id,
      title: request.content.pullRequest.title,
      state: request.content.pullRequest.state
    };
  return pullrequest;
}

function create_attachement(author, text, color){
  const attachment = {
//    author_name: author.displayname,
//    author_link: author.link,
//    author_icon: author.avatar,
    text: text,
    color: color || '#999999'
  };
  return attachment;
}

function comment(request, color) {
  const info = get_basic_info(request);

  const commit = request.content.commit;
  const comment = request.content.comment;

  let text = '';
  text += "*Comment* on ["+commit+"](" + info.repository.link+'commits/'+commit+ ")\n```\n" + comment.text + "\n```";

  return {
    content: {
      username: info.author.displayname,
      avatar: info.author.avatar,
      attachments: [create_attachement(info.author, text, color)],
      parseUrls: false
    }
  };
}

function pullrequest(request, color) {
  const info = get_basic_pr_info(request);
  const author = info.author;
  const pullrequest = get_pr_info(request);
    
  let text = "*"+pullrequest.state+"* pull-request : " +
      "`"+pullrequest.sourcebranch+"` to " + "`"+pullrequest.destinationbranch+"` "+ "of [" + info.repository.name + "](" + info.repository.link + ")" + '\n' +
      "[" + pullrequest.title + "]" + "(" + info.repository.link+'pull-requests/'+pullrequest.id+'/'+'overview' + ")";

  return {
    content: {
      username: info.author.displayname,
      avatar: info.author.avatar,
      attachments: [create_attachement(info.author, text, color)],
      parseUrls: false
    }
  };
}


const processors = {

  repo_refs_changed (request) {
    const info = get_basic_info(request);
    const commit = request.content.changes[0];

    let text = "*Pushed* [" + commit.toHash + "]" + "(" + info.repository.link+'commits/'+commit.toHash+ ") "+
        "on `"+commit.ref.displayId+"` of [" + info.repository.name + "](" + info.repository.link + ")";

    return {
      content: {
        username: info.author.displayname,
        avatar: info.author.avatar,
        attachments: [create_attachement(info.author, text, '#14892c')],
        parseUrls: false
      }
    };
  },

  repo_comment_added(request) {
    return comment(request, '#14892c');
  },
  repo_comment_edited(request) {
    return comment(request, '#ff9a0c');
  },
  repo_comment_deleted(request) {
    return comment(request, '#ce1616');
  },

  /*
  création -> bleu
  mise à jour -> orange
  approbation -> vert plus clair
  désaprobation -> rouge plus clair
  */
  pr_opened(request) {
    return pullrequest(request, '#4bb5c1');
  },
  pr_merged(request) {
    // Add participants and commit
    return pullrequest(request, '#14892c');
  },
  pr_declined(request) {
    // Add participants who decline
    return pullrequest(request, '#ce1616');
  },
  pr_deleted(request) {
    // Add participants who delete
    return pullrequest(request, '#ce1616');
  },
  
  pr_reviewer_approved(request) {
    '#25ff52'
  },
  
  pr_reviewer_unapproved(request) {
    '#ff1b1b'
  },
  
  pr_reviewer_needs_work(request) {
    '#ffc70b'
  },
  
  pr_comment_added(request) {
    '#ff9a0c'
  },
  
  pr_comment_edited(request) {
    '#ff9a0c'
  },
  
  pr_comment_deleted(request) {
    return pullrequest(request, '#ff9a0c');
  },

  pullrequest_rejected(request) {
    const author = {
      username: request.content.pullrequest.author.username,
      displayname: request.content.pullrequest.author.display_name
    };
    const pullrequest = {
      sourcerepo: request.content.pullrequest.source.repository.name,
      sourcebranch: request.content.pullrequest.source.branch.name,
      destinationrepo: request.content.pullrequest.destination.repository.name,
      destinationbranch: request.content.pullrequest.destination.branch.name,
      title: request.content.pullrequest.title,
      reason: request.content.pullrequest.reason
    };
    let text = '';
    text += author.displayname + ' (@' + author.username + ') declined a pull request:\n';
    text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '`\n\n';
    text += 'Reason:\n';
    text += pullrequest.reason + '\n';
    const attachment = {
      author_name: 'DECLINED: ' + pullrequest.title
    };
    return {
      content: {
        text: text,
        attachments: [attachment],
        parseUrls: false,
        color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
      }
    };
  },

  pullrequest_approved(request) {
    const author = {
      username: request.content.approval.user.username,
      displayname: request.content.approval.user.display_name
    };
    const pullrequest = {
      sourcerepo: request.content.pullrequest.source.repository.name,
      sourcebranch: request.content.pullrequest.source.branch.name,
      destinationrepo: request.content.pullrequest.destination.repository.name,
      destinationbranch: request.content.pullrequest.destination.branch.name,
      title: request.content.pullrequest.title,
      reason: request.content.pullrequest.reason
    };
    let text = '';
    text += author.displayname + ' (@' + author.username + ') approved a pull request:\n';
    text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '`\n\n';
    const attachment = {
      author_name: 'APPROVED: ' + pullrequest.title
    };
    return {
      content: {
        text: text,
        attachments: [attachment],
        parseUrls: false,
        color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
      }
    };
  },

  pullrequest_unapproved(request) {
    const author = {
      username: request.content.approval.user.username,
      displayname: request.content.approval.user.display_name
    };
    const pullrequest = {
      sourcerepo: request.content.pullrequest.source.repository.name,
      sourcebranch: request.content.pullrequest.source.branch.name,
      destinationrepo: request.content.pullrequest.destination.repository.name,
      destinationbranch: request.content.pullrequest.destination.branch.name,
      title: request.content.pullrequest.title,
      reason: request.content.pullrequest.reason
    };
    let text = '';
    text += author.displayname + ' (@' + author.username + ') unapproved a pull request:\n';
    text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '`\n\n';
    const attachment = {
      author_name: 'UNAPPROVED: ' + pullrequest.title
    };
    return {
      content: {
        text: text,
        attachments: [attachment],
        parseUrls: false,
        color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
      }
    };
  },

  pullrequest_fulfilled(request) {
    const author = {
      username: request.content.pullrequest.author.username,
      displayname: request.content.pullrequest.author.display_name
    };
    const pullrequest = {
      sourcerepo: request.content.pullrequest.source.repository.name,
      sourcebranch: request.content.pullrequest.source.branch.name,
      destinationrepo: request.content.pullrequest.destination.repository.name,
      destinationbranch: request.content.pullrequest.destination.branch.name,
      title: request.content.pullrequest.title,
      description: request.content.pullrequest.description
    };
    let text = '';
    text += author.displayname + ' (@' + author.username + ') merged a pull request:\n';
    text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '`\n\n';
    if(pullrequest.description !== '') {
      text += 'Description:\n';
      text += pullrequest.description + '\n';
    }
    const attachment = {
      author_name: 'MERGED: ' + pullrequest.title
    };
    return {
      content: {
        text: text,
        attachments: [attachment],
        parseUrls: false,
        color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
      }
    };
  },

  pullrequest_updated(request) {
    const author = {
      username: request.content.pullrequest.author.username,
      displayname: request.content.pullrequest.author.display_name
    };
    const pullrequest = {
      sourcebranch: request.content.pullrequest.source.branch.name,
      destinationbranch: request.content.pullrequest.destination.branch.name,
      title: request.content.pullrequest.title,
      description: request.content.pullrequest.description
    };
    let text = '';
    text += author.displayname + ' (@' + author.username + ') updated a pull request:\n';
    text += pullrequest.sourcebranch + ' => ' + pullrequest.destinationbranch + '\n';
    if(pullrequest.description !== '') {
      text += 'Description:\n';
      text += pullrequest.description + '\n';
    }
    const attachment = {
      author_name: 'UPDATED: ' + pullrequest.title
    };
    return {
      content: {
        text: text,
        attachments: [attachment],
        parseUrls: false,
        color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
      }
    };
  },

  pullrequest_comment_created(request) {
    const author = {
      username: request.content.pullrequest.user.username,
      displayname: request.content.pullrequest.user.display_name
    };
    const comment = {
      text: request.content.pullrequest.content.raw,
      id: request.content.pullrequest.id,
      link: request.content.pullrequest.links.self.href
    };
    let text = '';
    text += author.displayname + ' (@' + author.username + ') commented on a pull request:\n';
    text += 'Comment:\n';
    text += comment.text + '\n';
    const attachment = {
      author_name: '#' + comment.id,
      author_link: comment.link
    };
    return {
      content: {
        text: text,
        attachments: [attachment],
        parseUrls: false,
        color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
      }
    };
  },

  pullrequest_comment_deleted(request) {
    const author = {
      username: request.content.pullrequest.user.username,
      displayname: request.content.pullrequest.user.display_name
    };
    const comment = {
      text: request.content.pullrequest.content.raw,
      id: request.content.pullrequest.id,
      link: request.content.pullrequest.links.self.href
    };
    let text = '';
    text += author.displayname + ' (@' + author.username + ') deleted a comment on a pull request:\n';
    text += 'Comment:\n';
    text += comment.text + '\n';
    const attachment = {
      author_name: '#' + comment.id,
      author_link: comment.link
    };
    return {
      content: {
        text: text,
        attachments: [attachment],
        parseUrls: false,
        color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
      }
    };
  },

  pullrequest_comment_updated(request) {
    const author = {
      username: request.content.pullrequest.user.username,
      displayname: request.content.pullrequest.user.display_name
    };
    const comment = {
      text: request.content.pullrequest.content.raw,
      id: request.content.pullrequest.id,
      link: request.content.pullrequest.links.self.href
    };
    let text = '';
    text += author.displayname + ' (@' + author.username + ') updated a comment on a pull request:\n';
    text += 'Comment:\n';
    text += comment.text + '\n';
    const attachment = {
      author_name: '#' + comment.id,
      author_link: comment.link
    };
    return {
      content: {
        text: text,
        attachments: [attachment],
        parseUrls: false,
        color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
      }
    };
  }
};

class Script {
  /**
     * @params {object} request
     */
  process_incoming_request({ request }) {
    console.log('>>> REQUEST: '+JSON.stringify(request));
    /*return {
      content: {
      	"text": JSON.stringify(request, null, 2)
      }
    };*/
    try {
      if (request.headers['x-event-key']) {
        const key = request.headers['x-event-key'].replace(/:/g, '_');
    	console.log('>>> EVENT: '+key+' <<<');
        if ( processors[key] ) {
          return processors[key](request);
        }
      }
      return {};
    } catch(e) {
      console.log('sources event error', e);
      return {
        error: {
          success: false,
          message: `${e.message || e} ${JSON.stringify(request)}`
        }
      };
    }
  }
}

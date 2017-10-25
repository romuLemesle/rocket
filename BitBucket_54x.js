/*jshint esversion: 6 */

const color = {
  green: '#14892c',
  orange: '#ff9a0c',
  red: '#ce1616',
  blue: '#4bb5c1',
  fluo_green: '#25ff52',
  fluo_orange: '#ffc70b',
  fluo_red: '#ff1b1b'
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

function get_participant_pr_info(request) {
  const participant = {
    displayname: request.content.participant.user.displayName,
    avatar: 'https://sources.byzaneo.com/users/'+request.content.participant.user.name+'/avatar.png?s=16',
    status: request.content.participant.status
  };
  return participant;
}

function get_comment_pr_info(request) {
  const comment = {
    displayname: request.content.comment.author.displayName,
    avatar: 'https://sources.byzaneo.com/users/'+request.content.comment.author.name+'/avatar.png?s=16',
    text: request.content.comment.text
  };
  return comment;
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

function create_attachement_participant(participant, text, color){
  const attachment = {
    author_name: participant.displayname,
    author_icon: participant.avatar,
    text: text,
    color: color || '#999999'
  };
  return attachment;
}

function create_attachement_comment(comment, text, color){
  const attachment = {
    author_name: comment.displayname,
    author_icon: comment.avatar,
    text: text + "\n```\n" + comment.text + "\n```",
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
    
  let text = "*"+pullrequest.state+"* " +
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

function pullrequest_participant(request, color, state) {
  const info = get_basic_pr_info(request);
  const author = info.author;
  const participant = get_participant_pr_info(request);
  const pullrequest = get_pr_info(request);
    
  let text = "*"+state+"* " +
      "`"+pullrequest.sourcebranch+"` to " + "`"+pullrequest.destinationbranch+"` "+ "of [" + info.repository.name + "](" + info.repository.link + ")" + '\n' +
      "[" + pullrequest.title + "]" + "(" + info.repository.link+'pull-requests/'+pullrequest.id+'/'+'overview' + ")";
  
  return {
    content: {
      username: info.author.displayname,
      avatar: info.author.avatar,
      attachments: [create_attachement_participant(participant, text, color)],
      parseUrls: false
    }
  };
}

function pullrequest_comment(request, color) {
  const info = get_basic_pr_info(request);
  const author = info.author;
  const comment = get_comment_pr_info(request);
  const pullrequest = get_pr_info(request);
    
  let text = "*Comment* on " + "[" + pullrequest.title + "]" + "(" + info.repository.link+'pull-requests/'+pullrequest.id+'/'+'overview' + ")";
  
  return {
    content: {
      username: info.author.displayname,
      avatar: info.author.avatar,
      attachments: [create_attachement_comment(comment, text, color)],
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
    return comment(request, color.green);
  },
  repo_comment_edited(request) {
    return comment(request, color.orange);
  },
  repo_comment_deleted(request) {
    return comment(request, color.red);
  },

  pr_opened(request) {
    return pullrequest(request, color.blue);
  },
  pr_merged(request) {
    return pullrequest(request, color.green);
  },
  pr_declined(request) {
    return pullrequest(request, color.red);
  },
  pr_deleted(request) {
    return pullrequest(request, color.orange);
  },
  
  pr_reviewer_approved(request) {
    return pullrequest_participant(request, color.fluo_green, 'Approved');
  },
  
  pr_reviewer_unapproved(request) {
    return pullrequest_participant(request, color.fluo_red, 'Unapproved');
  },
  
  pr_reviewer_needs_work(request) {
    return pullrequest_participant(request, color.fluo_orange, 'Need Work');
  },
  
  pr_comment_added(request) {
    return pullrequest_comment(request, color.green);
  },
  
  pr_comment_edited(request) {
    return pullrequest_comment(request, color.orange);
  },
  
  pr_comment_deleted(request) {
    return pullrequest_comment(request, color.red);
  }
};

class Script {
  /**
     * @params {object} request
     */
  process_incoming_request({ request }) {
    //console.log('>>> REQUEST: '+JSON.stringify(request));
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
        content: {
        	username: "Error",
        	attachments: [create_attachement("Error", JSON.stringify(request), '#ce1616')],
        	parseUrls: false
        }
      };
    }
  }
}

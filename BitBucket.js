function newMessage(request, emoji, text) {
  let msg = { 
    content: {
      username: request.content.actor.displayName,
      emoji: emoji,
      parseUrls: false
    }
  };
  if ( text ) 
    msg.content.text = text;
  return msg;
}

function pullRequestMessage(request, emoji, color, text) {
  let msg = newMessage(request, emoji, text);
  msg.content.attachments = pullRequestAttachment(request, color);
  return msg;
}

function pullRequestAttachment(request, color) {
  return [{
    collapsed: true,
    color: color,
    title: request.content.pullrequest.title,
    title_link: request.content.pullrequest.link,
    fields: newFields(request)
  }];
}

function newFields(request) {
  return [{
    short: false,
    title: 'Project',
    value: '['+request.content.repository.project.key+'] '+request.content.repository.project.name
  }, {
    short: false,
    title: 'Repository',
    value: '['+request.content.repository.slug+']('+request.content.repository.links.self[0].href+')'
  }];
}

const processors = {
  pullrequest_comment(request) {
    return pullRequestMessage(request, ':speech_balloon:', '#4fd1d9', request.content.comment);
  },
  pullrequest_created(request) {
    return pullRequestMessage(request, ':new:', '#ed7612');
  },
  pullrequest_updated(request) {
    return pullRequestMessage(request, ':arrows_counterclockwise:', '#006dae');
  },
  pullrequest_fulfilled(request) {
    return pullRequestMessage(request, ':white_check_mark:', '#7ab51d');
  },
  pullrequest_rejected(request) {
    return pullRequestMessage(request, ':o2:', '#e81c27');
  },
  repo_push(request) {
    let change = request.content.push.changes[0];
    //console.log('>>> PUSH: '+JSON.stringify(change));
    let msg = newMessage(request, ':arrow_heading_down:');
   	msg.content.attachments = [{
      collapsed: true,
      color: (change.created ? '#41f45c' : (change.closed ? '#f44141' : '#4155f4')),
      title: change.new.name+'/'+change.new.target.hash,
      title_link: request.content.repository.links.self[0].href.replace('/browse', '/commits/')+change.new.target.hash,
      fields: newFields(request)
    }];
    return msg;
  }
};

class Script {
  process_incoming_request({ request }) {
    //console.log('>>> REQUEST: '+JSON.stringify(request));
    let result = { 
      content: {
        emoji: ':no_entry_sign:',
        text: JSON.stringify(request)
      }
    };
    if (request.headers['x-event-key']) {
      const key = request.headers['x-event-key'].replace(':', '_');
      if ( processors[key] )
      	result = processors[key](request);
    }
    return result;
  }
}

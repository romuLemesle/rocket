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
    fields: [{
      short: false,
      title: 'Project',
      value: '['+request.content.repository.project.key+'] '+request.content.repository.project.name
    }, {
      short: false,
      title: 'Repository',
      value: '['+request.content.repository.slug+']('+request.content.repository.links.self[0].href+')'
    }]
  }];
}

const processors = {
  pullrequest_comment(request) {
    return pullRequestMessage(request, ':speech_balloon:', '#4fd1d9', request.content.comment);
  },
  pullrequest_created(request) {
    return pullRequestMessage(request, ':speech_balloon:', request.content.comment);
  },
  pullrequest_updated(request) {
  },
  pullrequest_fulfilled(request) {
  },
  pullrequest_rejected(request) {
  }
};

class Script {
  process_incoming_request({ request }) {
    console.log('Trace: '+JSON.stringify(request));
    let result = {
      error: {
        success: false,
        message: 'Event not implemented: '+JSON.stringify(request)
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

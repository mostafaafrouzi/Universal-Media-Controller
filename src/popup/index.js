const save = async (data) => new Promise(done => {
    chrome.storage.sync.set(data, done);
})

const load = async (keys) => new Promise(done => {
    chrome.storage.sync.get(keys, done);
})

const checkUrl = (patterns=[], url) => {
    if (url) {
        return patterns.some(pattern => {
            const re = new RegExp(pattern, "i");
            return re.test(url)
        })
    }
}

const notify = (msg) => {
    toastr.remove()
    toastr.info('', msg)
}

const loadForm = async () => {
    const { blacklist } = await load(['blacklist'])
    $('textarea.textarea').val((blacklist || []).join('\n'))
}

$(() => {
    loadForm()
    $('textarea.textarea').change(async e => {
        const blacklist = e.target.value.split('\n').filter(x => x)
        await save({ blacklist })
        notify('Saved blacklist')
    })
})

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        // if using sendResposne asynchronously, need to synchronously return true
        // https://developer.chrome.com/docs/extensions/mv3/messaging/
        const respond = async () => {
            const { blacklist } = await load(['blacklist'])
            console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
            const activate = !checkUrl(blacklist, sender.tab.url)
            sendResponse({ activate });
        }
        respond()
        return true
    }
);
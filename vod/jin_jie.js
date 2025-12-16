class jiejieClass extends WebApiBase {
    /**
     * 姐姐视频 (jiejiesp.xyz) 采集源 - 更新版
     */
    constructor() {
        super();
        this.url = 'https://jiejiesp.xyz/jiejie';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Referer': 'https://jiejiesp.xyz/jiejie/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        };
    }

    // getClassList, getVideoList, searchVideo 方法保持不变（与之前相同）

    /**
     * 获取视频详情 + 播放线路（支持多线路多集）
     * @param {UZArgs} args
     * @returns {Promise<RepVideoDetail>}
     */
    async getVideoDetail(args) {
        let detailUrl = args.url;
        let backData = new RepVideoDetail();
        try {
            const pro = await req(detailUrl, { headers: this.headers });
            backData.error = pro.error;
            let proData = pro.data;
            if (proData) {
                let document = parse(proData);
                let detModel = new VideoDetail();

                detModel.vod_name = document.querySelector('.stui-content__detail h1')?.text.trim() || '';
                detModel.vod_pic = document.querySelector('.stui-content__thumb .lazyload')?.getAttribute('data-original') || '';
                if (detModel.vod_pic && !detModel.vod_pic.startsWith('http')) {
                    detModel.vod_pic = 'https:' + detModel.vod_pic;
                }
                detModel.vod_content = '姐姐视频资源';

                // 提取所有播放线路
                let playFromList = [];
                let playUrlList = [];

                let playlistHeaders = document.querySelectorAll('.stui-content__playlist.clearfix h4');
                let playlists = document.querySelectorAll('.stui-content__playlist.clearfix ul');

                for (let i = 0; i < playlistHeaders.length && i < playlists.length; i++) {
                    let fromName = playlistHeaders[i].text.trim() || `线路${i + 1}`;

                    let epis = playlists[i].querySelectorAll('li a');
                    let urlParts = [];
                    for (let ep of epis) {
                        let epName = ep.text.trim() || '第1集';
                        let epUrl = this.combineUrl(ep.getAttribute('href') || '');
                        if (epUrl) {
                            urlParts.push(`${epName}$${epUrl}`);
                        }
                    }
                    if (urlParts.length > 0) {
                        playFromList.push(fromName);
                        playUrlList.push(urlParts.join('#'));
                    }
                }

                if (playFromList.length === 0) {
                    // 备用：如果没有多线路，直接用当前页作为唯一播放源
                    playFromList.push('姐姐视频');
                    playUrlList.push(`播放$${detailUrl}`);
                }

                detModel.vod_play_from = playFromList.join('$$$');
                detModel.vod_play_url = playUrlList.join('$$$');

                detModel.vod_id = detailUrl;
                backData.data = detModel;
            }
        } catch (e) {
            backData.error = '解析视频详情失败～' + e.message;
        }
        return JSON.stringify(backData);
    }

    // getVideoPlayUrl 不需要实现，因为播放页本身就是可直接播放的（UZ影视会直接加载该页面解析视频源，通常是iframe或video标签）

    ignoreClassName = ['首页', '地址发布', '🌐地址发布'];
    
    combineUrl(url) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return this.webSite + url;
        return this.webSite + '/' + url;
    }

    isIgnoreClassName(name) {
        return this.ignoreClassName.some(ignore => name.includes(ignore));
    }

    removeTrailingSlash(str) {
        return str.endsWith('/') ? str.slice(0, -1) : str;
    }
}

var jiejiesp20251216 = new jiejieClass();

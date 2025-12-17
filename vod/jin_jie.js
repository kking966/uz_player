// ignore
//@name:JiejieSP-视频源
//@webSite:https://wap.jiejiesp19.xyz/jiejie/
//@version:1
//@remark:姐姐视频 MacCMS 源
//@isAV:0
// ignore

class JiejieVideo101 extends WebApiBase {
  constructor() {
    super();
    this.base = 'https://wap.jiejiesp19.xyz';
    this.site = 'JiejieSP';
  }

  // ========== 分类 ==========
  async getClassList() {
    const html = await req(this.base + '/jiejie/', { headers: { 'User-Agent': kUA.mobile } });
    const $ = cheerio.load(html);
    const data = [];

    $('.dropdown.type a').each((i, el) => {
      const name = $(el).text().trim();
      const href = $(el).attr('href');
      if (!name || !href) return;

      data.push({
        className: name,
        classId: href.startsWith('http') ? href : this.base + href,
        hasSubclass: false
      });
    });

    return { code: 0, msg: 'ok', data };
  }

  // ========== 分类列表 ==========
  async getVideoList(params) {
    const { classId, page = 1 } = params;
    let url = classId;
    if (page > 1) {
      url = classId.replace('.html', `/page/${page}.html`);
    }

    const html = await req(url, { headers: { 'User-Agent': kUA.mobile } });
    const $ = cheerio.load(html);
    const data = [];

    $('.stui-vodlist li').each((i, el) => {
      const a = $(el).find('a').first();
      const title = a.attr('title');
      const href = a.attr('href');
      const pic = $(el).find('img').attr('data-original') || $(el).find('img').attr('src');

      if (!href) return;

      data.push({
        vod_id: href.startsWith('http') ? href : this.base + href,
        vod_name: title,
        vod_pic: pic ? (pic.startsWith('http') ? pic : this.base + pic) : '',
        vod_remarks: ''
      });
    });

    return { code: 0, msg: 'ok', page, pagecount: 999, limit: data.length, total: 0, data };
  }

  // ========== 详情页 ==========
  async getVideoDetail(params) {
    const { id } = params;
    const html = await req(id, { headers: { 'User-Agent': kUA.mobile } });
    const $ = cheerio.load(html);

    const vod_name = $('h1').first().text().trim();
    const vod_pic = $('.stui-content__thumb img').attr('data-original') || '';
    const vod_content = $('.stui-content__desc').text().trim();

    const playFrom = [];
    const playUrls = [];

    $('.stui-pannel__head h3').each((i, el) => {
      playFrom.push($(el).text().trim() || `线路${i + 1}`);
      const eps = [];

      $('.stui-content__playlist').eq(i).find('a').each((j, a) => {
        const name = $(a).text().trim();
        const href = $(a).attr('href');
        if (!href) return;
        eps.push(`${name}$${this.base + href}`);
      });

      playUrls.push(eps.join('#'));
    });

    return {
      code: 0,
      msg: 'ok',
      data: [{
        vod_id: id,
        vod_name,
        vod_pic: vod_pic ? (vod_pic.startsWith('http') ? vod_pic : this.base + vod_pic) : '',
        vod_content,
        vod_play_from: playFrom.join('$$$'),
        vod_play_url: playUrls.join('$$$')
      }]
    };
  }

  // ========== 播放 ==========
  async getVideoPlayUrl(params, args) {
    const { id } = params;
    const html = await req(id, { headers: { 'User-Agent': kUA.mobile, Referer: this.base } });

    // iframe
    const iframe = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframe) {
      return {
        code: 0,
        msg: 'ok',
        data: {
          urls: [{ name: args?.flag || '默认线路', url: iframe[1] }],
          headers: { Referer: id }
        }
      };
    }

    // player_data
    const m3u8 = this.findM3U8(html);
    return {
      code: 0,
      msg: 'ok',
      data: {
        urls: [{ name: args?.flag || '默认线路', url: m3u8 }],
        headers: { Referer: id }
      }
    };
  }

  // ========== 搜索 ==========
  async searchVideo(params) {
    const { wd = '', page = 1 } = params;
    const url = `${this.base}/jiejie/index.php/vod/search.html?wd=${encodeURIComponent(wd)}`;
    const html = await req(url, { headers: { 'User-Agent': kUA.mobile } });
    const $ = cheerio.load(html);
    const data = [];

    $('.stui-vodlist li').each((i, el) => {
      const a = $(el).find('a').first();
      const title = a.attr('title');
      const href = a.attr('href');
      const pic = $(el).find('img').attr('data-original');

      if (!href) return;
      data.push({
        vod_id: this.base + href,
        vod_name: title,
        vod_pic: pic ? this.base + pic : '',
        vod_remarks: ''
      });
    });

    return { code: 0, msg: 'ok', page, pagecount: 999, limit: data.length, total: 0, data };
  }

  findM3U8(html) {
    const m = html.match(/(https?:\/\/[^"' ]+\.m3u8)/i);
    return m ? m[1] : '';
  }
}

const jiejieVideo101 = new JiejieVideo101();

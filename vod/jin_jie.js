// 高清一手资源 - uzVideo 最终可用版
var gqyszy = {
    site: {
        name: "高清一手资源",
        host: "https://www.gqyszy.xyz",
        logo: "https://www.gqyszy.xyz/template/fengmaxiu/images/logo.png",
        lang: "zh",
        type: 1
    },

    // 首页分类
    home: function () {
        return {
            class: [
                { type_id: "134", type_name: "女同性恋" },
                { type_id: "133", type_name: "变性伪娘" },
                { type_id: "132", type_name: "动漫卡通" },
                { type_id: "130", type_name: "人妻熟女" },
                { type_id: "129", type_name: "欧美激情" },
                { type_id: "122", type_name: "中文字幕" },
                { type_id: "93",  type_name: "高清无码" },
                { type_id: "105", type_name: "国产主播" }
            ],
            filters: {}
        };
    },

    // 分类列表
    category: function (tid, pg) {
        pg = pg || 1;
        var url = this.site.host + "/index.php/vod/type/id/" + tid + "/page/" + pg + ".html";
        var html = req(url);

        var list = [];
        var reg = /<a href="([^"]+vod\/detail\/id\/\d+\.html)[^"]*">[\s\S]*?<img[^>]+data-original="([^"]+)"[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g;
        var match;

        while ((match = reg.exec(html)) !== null) {
            list.push({
                vod_id: match[1],
                vod_name: match[3].trim(),
                vod_pic: match[2],
                vod_remarks: ""
            });
        }

        return {
            page: pg,
            pagecount: 999,
            limit: 20,
            total: 9999,
            list: list
        };
    },

    // 搜索
    search: function (wd, pg) {
        pg = pg || 1;
        var url = this.site.host + "/index.php/vod/search/page/" + pg + "/wd/" + encodeURIComponent(wd) + ".html";
        var html = req(url);

        var list = [];
        var reg = /<a href="([^"]+vod\/detail\/id\/\d+\.html)[^"]*">[\s\S]*?<img[^>]+data-original="([^"]+)"[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g;
        var match;

        while ((match = reg.exec(html)) !== null) {
            list.push({
                vod_id: match[1],
                vod_name: match[3].trim(),
                vod_pic: match[2],
                vod_remarks: ""
            });
        }

        return {
            page: pg,
            pagecount: 50,
            list: list
        };
    },

    // 详情页
    detail: function (id) {
        var url = id.indexOf("http") === 0 ? id : this.site.host + id;
        var html = req(url);

        var nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
        var name = nameMatch ? nameMatch[1] : "";

        var picMatch = html.match(/data-original="([^"]+)"/);
        var pic = picMatch ? picMatch[1] : "";

        var contentMatch = html.match(/<div class="vod_content">([\s\S]*?)<\/div>/);
        var content = contentMatch ? contentMatch[1].replace(/<[^>]+>/g, "") : "";

        var vod_play_url = "";
        var playMatch = html.match(/var player_aaaa=(\{[\s\S]*?\});/);

        if (playMatch) {
            try {
                var data = JSON.parse(playMatch[1]);
                var playUrl = data.url || "";
                if (playUrl.indexOf("/") === 0) {
                    playUrl = this.site.host + playUrl;
                }
                vod_play_url = "在线播放$" + playUrl;
            } catch (e) {}
        }

        return {
            vod_id: id,
            vod_name: name,
            vod_pic: pic,
            vod_content: content,
            vod_play_from: "直链",
            vod_play_url: vod_play_url
        };
    },

    // 播放
    play: function (flag, id) {
        return {
            parse: 0,
            url: id,
            header: {
                Referer: this.site.host,
                "User-Agent": "Mozilla/5.0"
            }
        };
    }
};

export default ces;

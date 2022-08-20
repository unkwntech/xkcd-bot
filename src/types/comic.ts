export default class Comic {
    public day: string;
    public month: string;
    public year: string;
    public num: number;
    public link: string;
    public news: string;
    public safe_title: string;
    public transcript: string;
    public alt: string;
    public img: string;
    public title: string;

    public constructor(json: any) {
        this.day = json.data || null;
        this.month = json.month || null;
        this.year = json.year || null;
        this.num = json.num;
        this.link = json.link || null;
        this.news = json.news || null;
        this.safe_title = json.safe_title || null;
        this.transcript = json.transcript || null;
        this.alt = json.alt || null;
        this.img = json.img || null;
        this.title = json.title;
    }

    public toEmbed(): object {
        return {
            title: this.title,
            description: this.alt,
            image: {
                url: this.img,
            },
            footer: {
                icon_url:
                    "https://github.com/unkwntech/xkcd-bot/raw/main/content/favicon-2.png",
                text: "Licensed CC-BY-NC 2.5 by Randall Munroe",
            },
            url: this.link,
        };
    }
}

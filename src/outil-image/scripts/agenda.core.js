import '../../scripts/librairies/secrets';
import '../../scripts/librairies/helpers';
import '../../scripts/librairies/lightswitch';

import DNDZone from "../../scripts/librairies/dndzone";
import ImageFrame from "../../scripts/librairies/imageframe";
import Notification from "../../scripts/librairies/notification";


({


	API_ENDPOINT: 'https://images.action.quebec',

	secrets: null,
	// options: null,

	container: null,
	selorg: null,
	seltype: null,

	imagegroup: null,
	imageL: null,
	imageR: null,
	image: null,

	frameL: null,
	frameR: null,

	btngroup: null,
	uploadbtn: null,
	browsebtn: null,

	results: null,
	copybtn: null,
	browse2btn: null,
	links: null,
	
	splash: null,
	splashdnd: null,

	loader: null,

	notif: null,



	init: async function() {
		Promise.all([
			this.loadSecrets(),
			documentReady(() => this.initUI())
		]);
	},

	loadSecrets: async function() {
		this.secrets = await SECRETS;
	},


	initUI: async function() {

		this.container = document.querySelector('.croper');
		this.imagegroup = create('div', 'croper__images');
		
		this.image = create('img');
		this.imageL = this.imagegroup.create('div', 'croper__images__box box--2-3');
		this.imageR = this.imagegroup.create('div', 'croper__images__box box--5-4');
		this.imageL.title = `Utilisez la molette pour zoomer`;
		this.imageR.title = `Utilisez la molette pour zoomer`;

		this.btngroup = create('div', 'croper__button');
		this.uploadbtn = this.btngroup.create('button', null, 'Téléverser');
		this.uploadbtn.addEventListener('click', () => this.uploadFiles());
		this.browsebtn = this.btngroup.create('button', null, 'Parcourir');
		this.browsebtn.addEventListener('click', () => this.browseFile());

		this.results = create('div', 'croper__results');
		this.results.create('div', 'croper__results__winner').title = `Tu veux-tu une médaille?`;
		this.results.create('div', 'croper__results__congrats', `Félicitations!`);
		this.results.create('div', 'croper__results__text', `Image téléversée avec succès. Il ne reste qu’à copier les liens et les coller dans la description de votre événement.`);
		const btncont = this.results.create('div', 'croper__results__btn');
		
		this.copybtn = btncont.create('button', 'croper__results__copy', `Copier les liens`);
		this.copybtn.addEventListener('click', () => this.copyLinks());

		this.browse2btn = btncont.create('button', 'croper__results__browse', `Parcourir`);
		this.browse2btn.addEventListener('click', () => this.browseFile());

		this.splash = create('div', 'croper__splash show', `Glissez-déposez votre image ici ou<br> cliquez ici pour choisir un fichier.`);
		this.splash.addEventListener('click', () => this.browseFile());
		this.splashdnd = new DNDZone(this.splash, { onFileDrop: file => this.drop(file) });

		this.loader = create('div', 'croper__loader');
		this.loader.create('div', 'loading-double-circular');

		this.frameL = new ImageFrame(this.imageL, '2/3');
		this.frameR = new ImageFrame(this.imageR, '5:4');

		this.notif = new Notification;

		this.container.replaceChildren(this.imagegroup, this.btngroup, this.results, this.splash, this.loader);


	},


	busy: async function(promise) {
		document.documentElement.classList.add('is-busy');	
		const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
		document.documentElement.classList.remove('is-busy');
		return typeof promise == 'array' ? results : results[0];
	},


	working: async function(promise) {
		document.documentElement.classList.add('is-working');	
		const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
		document.documentElement.classList.remove('is-working');
		return typeof promise == 'array' ? results : results[0];
	},



	handleFile: function(dropFile) {
		return new Promise((res, rej) => {
			if(dropFile.type.startsWith('image/') && dropFile.size <= 5242880) res(this.loadImage(dropFile));
			else rej("Fichier rejeté");
		});
    },


	browseFile: async function() {
		browse('image/*').then(async file => {
			await this.handleFile(file);
		}).catch(e => this.notif.error("Fichier rejeté"));
	},


	drop: function(file) {
		this.handleFile(file).catch(e => this.notif.error(e)); 
	},


	loadImage: async function(file) {
		this.image.src = URL.createObjectURL(file);
		await Promise.all([
			this.frameL.loadImage(file),
			this.frameR.loadImage(file)
		]);
		this.splash.classList.remove('show');
		this.results.classList.remove('show');
	},

	
}).init();
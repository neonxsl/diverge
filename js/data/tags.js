// Sub-groups of each category, so questions can get specific
// ("Name an African country starting with M"). Every name must exist in its category.
// Lenient on purpose: transcontinental countries appear in both continents, etc.

export const tags = {
  country: [
    { noun: 'an African country', names: 'Algeria;Angola;Benin;Botswana;Burkina Faso;Burundi;Cape Verde;Cameroon;Central African Republic;Chad;Comoros;Congo;DR Congo;Djibouti;Egypt;Equatorial Guinea;Eritrea;Eswatini;Ethiopia;Gabon;Gambia;Ghana;Guinea;Guinea-Bissau;Ivory Coast;Kenya;Lesotho;Liberia;Libya;Madagascar;Malawi;Mali;Mauritania;Mauritius;Morocco;Mozambique;Namibia;Niger;Nigeria;Rwanda;Sao Tome and Principe;Senegal;Seychelles;Sierra Leone;Somalia;South Africa;South Sudan;Sudan;Tanzania;Togo;Tunisia;Uganda;Zambia;Zimbabwe' },
    { noun: 'a European country', names: 'Albania;Andorra;Armenia;Austria;Azerbaijan;Belarus;Belgium;Bosnia and Herzegovina;Bulgaria;Croatia;Cyprus;Czechia;Denmark;Estonia;Finland;France;Georgia;Germany;Greece;Hungary;Iceland;Ireland;Italy;Kazakhstan;Kosovo;Latvia;Liechtenstein;Lithuania;Luxembourg;Malta;Moldova;Monaco;Montenegro;Netherlands;North Macedonia;Norway;Poland;Portugal;Romania;Russia;San Marino;Serbia;Slovakia;Slovenia;Spain;Sweden;Switzerland;Turkey;Ukraine;United Kingdom;Vatican City' },
    { noun: 'an Asian country', names: 'Afghanistan;Armenia;Azerbaijan;Bahrain;Bangladesh;Bhutan;Brunei;Cambodia;China;Cyprus;Georgia;India;Indonesia;Iran;Iraq;Israel;Japan;Jordan;Kazakhstan;Kuwait;Kyrgyzstan;Laos;Lebanon;Malaysia;Maldives;Mongolia;Myanmar;Nepal;North Korea;Oman;Pakistan;Palestine;Philippines;Qatar;Russia;Saudi Arabia;Singapore;South Korea;Sri Lanka;Syria;Taiwan;Tajikistan;Thailand;East Timor;Turkey;Turkmenistan;United Arab Emirates;Uzbekistan;Vietnam;Yemen' },
    { noun: 'a country in North or Central America (Caribbean counts)', names: 'Antigua and Barbuda;Bahamas;Barbados;Belize;Canada;Costa Rica;Cuba;Dominica;Dominican Republic;El Salvador;Grenada;Guatemala;Haiti;Honduras;Jamaica;Mexico;Nicaragua;Panama;Saint Kitts and Nevis;Saint Lucia;Saint Vincent and the Grenadines;Trinidad and Tobago;United States' },
    { noun: 'a South American country', names: 'Argentina;Bolivia;Brazil;Chile;Colombia;Ecuador;Guyana;Paraguay;Peru;Suriname;Uruguay;Venezuela' },
    { noun: 'a country in Oceania', names: 'Australia;Fiji;Kiribati;Marshall Islands;Micronesia;Nauru;New Zealand;Palau;Papua New Guinea;Samoa;Solomon Islands;Tonga;Tuvalu;Vanuatu' },
    { noun: 'a Middle Eastern country', names: 'Bahrain;Cyprus;Egypt;Iran;Iraq;Israel;Jordan;Kuwait;Lebanon;Oman;Palestine;Qatar;Saudi Arabia;Syria;Turkey;United Arab Emirates;Yemen' },
    { noun: 'a country on the Mediterranean Sea', names: 'Spain;France;Monaco;Italy;Malta;Slovenia;Croatia;Bosnia and Herzegovina;Montenegro;Albania;Greece;Turkey;Cyprus;Syria;Lebanon;Israel;Palestine;Egypt;Libya;Tunisia;Algeria;Morocco' },
    { noun: 'a country where Spanish is an official language', names: 'Spain;Mexico;Guatemala;Honduras;El Salvador;Nicaragua;Costa Rica;Panama;Cuba;Dominican Republic;Colombia;Venezuela;Ecuador;Peru;Bolivia;Chile;Argentina;Paraguay;Uruguay;Equatorial Guinea' },
    { noun: 'a country where French is an official language', names: 'France;Belgium;Switzerland;Luxembourg;Monaco;Canada;Haiti;Senegal;Ivory Coast;Mali;Niger;Burkina Faso;Benin;Togo;Guinea;Cameroon;Chad;Central African Republic;Gabon;Congo;DR Congo;Madagascar;Comoros;Djibouti;Burundi;Rwanda;Seychelles;Vanuatu;Equatorial Guinea' },
    { noun: 'a country where Portuguese is an official language', names: 'Portugal;Brazil;Angola;Mozambique;Cape Verde;Guinea-Bissau;Sao Tome and Principe;East Timor;Equatorial Guinea' },
    { noun: 'a country in the European Union', names: 'Austria;Belgium;Bulgaria;Croatia;Cyprus;Czechia;Denmark;Estonia;Finland;France;Germany;Greece;Hungary;Ireland;Italy;Latvia;Lithuania;Luxembourg;Malta;Netherlands;Poland;Portugal;Romania;Slovakia;Slovenia;Spain;Sweden' },
    { noun: 'a country that has hosted the Olympics', names: 'Greece;France;United States;United Kingdom;Sweden;Belgium;Netherlands;Germany;Finland;Australia;Italy;Japan;Mexico;Canada;Russia;South Korea;Spain;China;Brazil;Norway;Switzerland;Austria;Bosnia and Herzegovina' },
  ],
  capital: [
    { noun: 'a European capital', names: 'Tirana;Vienna;Minsk;Brussels;Sarajevo;Sofia;Zagreb;Nicosia;Prague;Copenhagen;Tallinn;Helsinki;Paris;Berlin;Athens;Budapest;Reykjavik;Dublin;Rome;Pristina;Riga;Vaduz;Vilnius;Luxembourg City;Valletta;Chisinau;Monaco;Podgorica;Amsterdam;Skopje;Oslo;Warsaw;Lisbon;Bucharest;Moscow;San Marino;Belgrade;Bratislava;Ljubljana;Madrid;Stockholm;Bern;Kyiv;London' },
    { noun: 'an Asian capital', names: 'Kabul;Manama;Dhaka;Thimphu;Phnom Penh;Beijing;New Delhi;Jakarta;Tehran;Baghdad;Jerusalem;Tokyo;Amman;Astana;Kuwait City;Bishkek;Vientiane;Beirut;Kuala Lumpur;Male;Ulaanbaatar;Naypyidaw;Kathmandu;Pyongyang;Muscat;Islamabad;Manila;Doha;Riyadh;Singapore;Seoul;Colombo;Damascus;Taipei;Dushanbe;Bangkok;Dili;Ashgabat;Abu Dhabi;Tashkent;Hanoi;Sanaa;Ankara;Tbilisi;Yerevan;Baku' },
    { noun: 'an African capital', names: 'Algiers;Luanda;Gaborone;Ouagadougou;Yaounde;Bangui;N\'Djamena;Moroni;Kinshasa;Brazzaville;Djibouti City;Cairo;Asmara;Addis Ababa;Libreville;Banjul;Accra;Conakry;Nairobi;Maseru;Monrovia;Tripoli;Antananarivo;Lilongwe;Bamako;Nouakchott;Port Louis;Rabat;Maputo;Windhoek;Niamey;Abuja;Kigali;Dakar;Victoria;Freetown;Mogadishu;Pretoria;Juba;Khartoum;Dodoma;Lome;Tunis;Kampala;Lusaka;Harare' },
    { noun: 'a capital city in the Americas', names: 'Buenos Aires;Nassau;Bridgetown;Belmopan;Sucre;Brasilia;Ottawa;Santiago;Bogota;San Jose;Havana;Santo Domingo;Quito;San Salvador;Guatemala City;Georgetown;Port-au-Prince;Tegucigalpa;Kingston;Mexico City;Managua;Panama City;Asuncion;Lima;Paramaribo;Port of Spain;Washington DC;Montevideo;Caracas' },
  ],
  city: [
    { noun: 'an Australian city', names: 'Sydney;Melbourne;Brisbane;Perth;Adelaide;Canberra;Hobart;Darwin;Gold Coast;Newcastle;Cairns;Geelong;Wollongong' },
    { noun: 'a city in Italy', names: 'Rome;Milan;Naples;Venice;Florence;Turin;Palermo;Bologna;Pisa;Verona' },
    { noun: 'a city in Spain', names: 'Madrid;Barcelona;Seville;Valencia;Bilbao;Granada;Malaga;Ibiza' },
    { noun: 'a city in Germany', names: 'Berlin;Hamburg;Munich;Cologne;Frankfurt;Dresden;Leipzig;Stuttgart;Dusseldorf' },
    { noun: 'a city in France', names: 'Paris;Marseille;Lyon;Nice;Bordeaux;Toulouse;Lille;Strasbourg;Cannes' },
    { noun: 'a city in Japan', names: 'Tokyo;Osaka;Nagoya;Kyoto;Yokohama;Sapporo;Hiroshima;Nara;Kobe;Fukuoka' },
    { noun: 'a city in China', names: 'Shanghai;Beijing;Chongqing;Tianjin;Guangzhou;Shenzhen;Chengdu;Nanjing;Wuhan;Hangzhou;Hong Kong;Xi\'an;Lhasa;Macau' },
    { noun: 'a city in India', names: 'Delhi;Mumbai;Kolkata;Bangalore;Chennai;Hyderabad;Ahmedabad;Surat;Pune;Jaipur;Agra;Varanasi' },
    { noun: 'a city in the UK', names: 'London;Edinburgh;Glasgow;Manchester;Liverpool;Birmingham;Leeds;Bristol;Cardiff;Belfast' },
    { noun: 'a city in Canada', names: 'Toronto;Montreal;Vancouver;Calgary;Ottawa;Quebec City' },
  ],
  animal: [
    { noun: 'a sea creature', names: 'Anglerfish;Barracuda;Clam;Cod;Crab;Cuttlefish;Dolphin;Eel;Jellyfish;Krill;Lobster;Manatee;Manta ray;Narwhal;Octopus;Orca;Oyster;Porpoise;Prawn;Sea lion;Seahorse;Seal;Shark;Shrimp;Squid;Starfish;Stingray;Tuna;Walrus;Whale;Salmon;Turtle' },
    { noun: 'a farm animal', names: 'Chicken;Cow;Donkey;Duck;Goat;Goose;Horse;Llama;Alpaca;Mule;Ox;Pig;Sheep;Turkey;Rabbit;Quail;Buffalo' },
    { noun: 'an animal people keep as a pet', names: 'Cat;Dog;Rabbit;Hamster;Guinea pig;Goldfish;Mouse;Rat;Gerbil;Ferret;Chinchilla;Parrot;Lizard;Snake;Tortoise;Turtle;Horse;Gecko;Axolotl;Hedgehog;Iguana;Tarantula;Chicken;Frog' },
    { noun: 'an African animal', names: 'Aardvark;Antelope;Baboon;Buffalo;Cheetah;Chimpanzee;Crocodile;Elephant;Flamingo;Gazelle;Giraffe;Gnu;Gorilla;Hippopotamus;Hyena;Impala;Jackal;Leopard;Lion;Mandrill;Meerkat;Mongoose;Okapi;Ostrich;Rhinoceros;Warthog;Zebra;Lemur;Chameleon;Vulture;Ibis' },
    { noun: 'an Australian animal', names: 'Kangaroo;Koala;Wombat;Wallaby;Platypus;Emu;Dingo;Kookaburra;Crocodile;Echidna;Quokka;Tasmanian devil;Bilby;Cockatoo;Cassowary;Opossum' },
    { noun: 'a reptile or amphibian', names: 'Alligator;Anaconda;Axolotl;Chameleon;Cobra;Crocodile;Frog;Gecko;Iguana;Komodo dragon;Lizard;Newt;Python;Rattlesnake;Salamander;Snake;Toad;Tortoise;Turtle' },
    { noun: 'a creepy-crawly', names: 'Ant;Bee;Beetle;Butterfly;Caterpillar;Centipede;Cockroach;Cricket;Dragonfly;Earthworm;Firefly;Fly;Grasshopper;Hornet;Ladybug;Locust;Mosquito;Moth;Scorpion;Slug;Snail;Spider;Tarantula;Termite;Wasp' },
    { noun: 'an animal that lives somewhere freezing', names: 'Polar bear;Penguin;Walrus;Seal;Narwhal;Orca;Reindeer;Caribou;Puffin;Yak;Moose;Wolf;Lynx;Albatross;Krill' },
    { noun: 'a black and white animal', names: 'Zebra;Panda;Penguin;Skunk;Orca;Cow;Magpie;Badger;Puffin;Tapir' },
    { noun: 'an animal with a shell', names: 'Turtle;Tortoise;Snail;Crab;Lobster;Clam;Oyster;Armadillo;Prawn;Shrimp' },
  ],
  fruit: [
    { noun: 'a red fruit', names: 'Apple;Cherry;Strawberry;Raspberry;Cranberry;Pomegranate;Watermelon;Tomato;Lychee;Rambutan;Dragon fruit;Plum;Grape' },
    { noun: 'a yellow fruit', names: 'Banana;Lemon;Pineapple;Mango;Starfruit;Quince;Grapefruit;Papaya;Yuzu;Durian;Physalis;Melon' },
    { noun: 'a tropical fruit', names: 'Banana;Coconut;Dragon fruit;Durian;Guava;Jackfruit;Lychee;Mango;Mangosteen;Papaya;Passion fruit;Pineapple;Rambutan;Starfruit;Acai;Plantain;Avocado' },
  ],
  food: [
    { noun: 'an Italian dish', names: 'Pizza;Pasta;Spaghetti;Lasagne;Risotto;Gnocchi;Ravioli;Tiramisu;Gelato;Bruschetta;Calzone;Burrata;Carbonara;Bolognese;Pesto;Panna cotta;Cannoli;Focaccia;Arancini;Minestrone;Prosciutto;Macaroni' },
    { noun: 'a Japanese food', names: 'Sushi;Ramen;Tempura;Mochi;Sashimi;Udon;Teriyaki;Miso soup;Gyoza;Katsu;Yakitori;Onigiri;Okonomiyaki;Tofu' },
    { noun: 'a Mexican food', names: 'Taco;Burrito;Nachos;Enchilada;Fajita;Quesadilla;Guacamole;Churro;Tamale;Salsa;Tostada;Chimichanga;Mole;Pozole;Elote;Tortilla' },
    { noun: 'an Indian dish', names: 'Biryani;Curry;Samosa;Butter chicken;Tikka masala;Naan;Dal;Korma;Vindaloo;Pakora;Bhaji;Paneer;Chapati;Dosa' },
    { noun: 'a Chinese dish', names: 'Dim sum;Dumpling;Kung pao chicken;Fried rice;Chow mein;Sweet and sour pork;Peking duck;Bao;Wonton;Mapo tofu;Hot pot;Spring roll;Noodles' },
    { noun: 'a French food', names: 'Croissant;Baguette;Crepe;Quiche;Croque monsieur;Ratatouille;Coq au vin;Bouillabaisse;Souffle;Escargot;Creme brulee;Eclair;Macaron;Meringue' },
    { noun: 'a Greek food', names: 'Moussaka;Baklava;Gyros;Souvlaki;Tzatziki;Spanakopita' },
    { noun: 'a dessert', names: 'Cake;Cheesecake;Brownie;Cupcake;Doughnut;Ice cream;Meringue;Pudding;Tiramisu;Pavlova;Lamington;Gelato;Mochi;Churro;Crepe;Strudel;Pie;Muffin;Panna cotta;Cannoli;Macaron;Trifle;Sundae;Eclair;Creme brulee;Apple crumble;Fudge;Custard;Baklava;Souffle;Chocolate;Biscuit' },
    { noun: 'a breakfast food', names: 'Bagel;Bacon;Croissant;Egg;Granola;Muffin;Omelette;Pancake;Porridge;Toast;Waffle;Yoghurt;Cereal;Hash brown;French toast;Eggs Benedict;Sausage;Crepe' },
  ],
  sport: [
    { noun: 'a sport played with a ball', names: 'Baseball;Basketball;Bowling;Cricket;Croquet;Dodgeball;Field hockey;Football;American football;Australian rules football;Golf;Handball;Hurling;Korfball;Lacrosse;Netball;Polo;Pool;Rugby;Snooker;Softball;Squash;Table tennis;Tennis;Volleyball;Water polo;Pickleball;Bocce;Lawn bowls;Ten-pin bowling;Sepak takraw' },
    { noun: 'a team sport', names: 'Baseball;Basketball;Cricket;Curling;Dodgeball;Field hockey;Football;American football;Australian rules football;Handball;Hockey;Hurling;Ice hockey;Korfball;Lacrosse;Netball;Polo;Rugby;Softball;Volleyball;Water polo;Kabaddi;Rowing;Bobsleigh;Sepak takraw;Frisbee' },
    { noun: 'a water sport', names: 'Canoeing;Diving;Kayaking;Rowing;Sailing;Surfing;Swimming;Water polo;Kitesurfing;Windsurfing;Wakeboarding;Fishing' },
  ],
  instrument: [
    { noun: 'a percussion instrument', names: 'Bongo;Cymbal;Drum;Glockenspiel;Gong;Marimba;Maracas;Tambourine;Timpani;Triangle;Xylophone;Castanets;Cowbell;Steel drum;Tabla;Djembe;Cajon;Kalimba' },
    { noun: 'an instrument you blow into', names: 'Bassoon;Clarinet;Flute;Oboe;Piccolo;Recorder;Saxophone;Bagpipes;Ocarina;Panpipes;Didgeridoo;Harmonica;Kazoo;Melodica;Trumpet;Trombone;Tuba;French horn;Cornet;Euphonium;Sousaphone;Bugle' },
  ],
  colour: [
    { noun: 'a shade of blue', names: 'Blue;Navy;Turquoise;Teal;Cyan;Aqua;Azure;Cobalt;Sapphire;Sky blue;Royal blue;Periwinkle;Cerulean;Indigo' },
    { noun: 'a shade of red or pink', names: 'Red;Pink;Crimson;Scarlet;Burgundy;Maroon;Coral;Salmon;Ruby;Magenta;Fuchsia;Rose;Vermilion;Mahogany;Rust' },
    { noun: 'a shade of green', names: 'Green;Teal;Olive;Lime;Mint;Emerald;Jade;Chartreuse' },
    { noun: 'a colour that is also a food', names: 'Peach;Salmon;Lime;Lemon;Mint;Olive;Mustard;Plum;Cream;Orange' },
    { noun: 'a colour that is also a gem or metal', names: 'Gold;Silver;Bronze;Copper;Emerald;Jade;Sapphire;Ruby;Amber;Cobalt' },
  ],
  body: [
    { noun: 'a part of your face', names: 'Cheek;Chin;Ear;Eye;Eyebrow;Eyelash;Eyelid;Forehead;Lip;Mouth;Nose;Nostril;Tooth;Tongue;Temple;Jaw;Gum' },
    { noun: 'a part of your arm or hand', names: 'Finger;Fingernail;Knuckle;Palm;Thumb;Wrist;Elbow;Bicep;Tricep;Arm;Hand;Shoulder;Armpit' },
    { noun: 'a part of your leg or foot', names: 'Ankle;Calf;Foot;Heel;Hip;Knee;Kneecap;Shin;Thigh;Toe;Hamstring;Femur;Leg' },
  ],
  clothing: [
    { noun: 'something you wear on your head', names: 'Bandana;Beanie;Beret;Cap;Hat;Sombrero;Top hat;Turban;Veil;Fedora;Sunglasses' },
    { noun: 'something you wear when it\'s freezing', names: 'Beanie;Cardigan;Coat;Glove;Hoodie;Jacket;Jumper;Mitten;Parka;Scarf;Turtleneck;Boot;Tights;Stockings' },
  ],
  car: [
    { noun: 'an American car brand', names: 'Buick;Cadillac;Chevrolet;Chrysler;Dodge;Ford;GMC;Jeep;Lincoln;Ram;Tesla;Rivian;Lucid;Hummer;Pontiac' },
    { noun: 'a British car brand', names: 'Aston Martin;Bentley;Jaguar;Land Rover;Lotus;McLaren;Mini;Rolls-Royce;Vauxhall;MG' },
    { noun: 'a French car brand', names: 'Citroen;Peugeot;Renault;Bugatti' },
    { noun: 'a Swedish or Korean car brand', names: 'Volvo;Saab;Koenigsegg;Polestar;Hyundai;Kia;Genesis;Ssangyong' },
  ],
  language: [
    { noun: 'a language that comes from Latin', names: 'French;Italian;Spanish;Portuguese;Romanian;Catalan;Latin' },
  ],
  job: [
    { noun: 'a job in a hospital', names: 'Doctor;Nurse;Surgeon;Paramedic;Midwife;Pharmacist;Receptionist;Cleaner;Therapist;Dietitian;Psychologist;Janitor;Security guard' },
    { noun: 'a job where you wear a uniform', names: 'Police officer;Firefighter;Soldier;Nurse;Pilot;Chef;Paramedic;Sailor;Security guard;Waiter;Postman;Lifeguard;Referee;Captain;Zookeeper;Mechanic;Butler;Usher;Chauffeur;Janitor;Astronaut;Judge' },
    { noun: 'a job that works with animals', names: 'Vet;Zookeeper;Farmer;Beekeeper;Fisherman;Biologist' },
  ],
  element: [
    { noun: 'an element that is a gas at room temperature', names: 'Hydrogen;Helium;Nitrogen;Oxygen;Fluorine;Neon;Chlorine;Argon;Krypton;Xenon;Radon' },
  ],
};

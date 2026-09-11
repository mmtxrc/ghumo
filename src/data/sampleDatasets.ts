/**
 * Real Sample Datasets for Ghumo Search & AI Travel Planner
 * Sourced directly from sample1.json, video-itinerary.json, keyword-itinerary.json, and output-w-image.json
 */

export interface PlaceItem {
  id: string;
  name: string;
  category: string;
  city: string;
  reason?: string;
  history?: string;
  culture?: string;
  must_see?: string;
  ticket_price?: string;
  timings?: string;
  rating?: number;
  imageUrl?: string;
  lat?: number;
  lng?: number;
}

export interface ItineraryItem {
  id: string;
  title: string;
  location: string;
  summary: string;
  budget?: string;
  days: {
    dayNumber: number;
    title: string;
    places: {
      time: string;
      name: string;
      description: string;
    }[];
  }[];
  tips?: string[];
  recommendedPlaces?: {
    name: string;
    reason: string;
    type?: string;
  }[];
}

// Places from output-w-image.json, sample1.json, video-itinerary.json
export const SAMPLE_PLACES: PlaceItem[] = [
  {
    id: 'place_red_fort',
    name: 'Red Fort (Lal Qila)',
    category: 'Mughal Heritage & Fortress',
    city: 'Old Delhi',
    reason: 'An iconic UNESCO World Heritage Site that marks the entrance to Chandni Chowk and stands as a magnificent symbol of India’s Mughal heritage.',
    history: 'Built by Mughal Emperor Shah Jahan in 1639 when he shifted the capital from Agra to Shahjahanabad. Served as the main imperial residence for 200 years.',
    culture: 'Site where the Indian national flag is hoisted on Independence Day every year.',
    must_see: 'Diwan-i-Aam, Diwan-i-Khas, Lahori Gate, and evening sound & light show.',
    ticket_price: 'INR 50 (Indians), INR 600 (Foreigners)',
    timings: '9:30 AM to 4:30 PM (Closed Mondays)',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=800&auto=format&fit=crop&q=80',
    lat: 28.6562,
    lng: 77.241,
  },
  {
    id: 'place_jama_masjid',
    name: 'Jama Masjid',
    category: 'Grand Mosque & Architecture',
    city: 'Old Delhi',
    reason: 'One of the largest and most architecturally stunning mosques in India, commissioned by Shah Jahan in 1656 AD.',
    history: 'Built with red sandstone and white marble by thousands of artisans over 6 years.',
    culture: 'Spiritual heart of Old Delhi with massive congregational prayers.',
    must_see: 'Massive central courtyard (25,000 capacity), southern minaret panoramic view.',
    ticket_price: 'Free entry (INR 300 camera fee)',
    timings: '7:00 AM to 12:00 PM, 1:30 PM to 6:30 PM',
    rating: 4.9,
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Jama_Masjid_-Chandni_Chowk_-Delhi_-DSC_0001.jpg/1280px-Jama_Masjid_-Chandni_Chowk_-Delhi_-DSC_0001.jpg',
    lat: 28.6507,
    lng: 77.2334,
  },
  {
    id: 'place_gurudwara_sis_ganj',
    name: 'Gurudwara Sis Ganj Sahib',
    category: 'Spiritual Shrine & Community Kitchen',
    city: 'Chandni Chowk',
    reason: 'Deeply spiritual historic Sikh shrine commemorating Guru Tegh Bahadur, running a massive 24/7 free community kitchen (Langar).',
    history: 'Established in 1783 to commemorate the martyrdom of the ninth Sikh Guru.',
    culture: 'Monument to religious freedom and selfless service feeding thousands daily.',
    must_see: 'Main prayer hall with Guru Granth Sahib, sacred banyan tree, Langar kitchen.',
    ticket_price: 'Free',
    timings: 'Open 24 Hours',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    lat: 28.6558,
    lng: 77.2323,
  },
  {
    id: 'place_india_gate',
    name: 'India Gate & Kartavya Path',
    category: 'War Memorial & Public Lawns',
    city: 'New Delhi',
    reason: 'Iconic 42-meter high war memorial arch and symbol of Indian bravery.',
    history: 'Built in 1931 to commemorate 84,000 Indian soldiers who died in World War I.',
    culture: 'Vibrant evening hub with ice cream vendors, picnics, and eternal flame.',
    must_see: 'The Amar Jawan Jyoti, National War Memorial, and surrounding lawns.',
    ticket_price: 'Free',
    timings: 'Open 24 Hours',
    rating: 4.8,
    lat: 28.6129,
    lng: 77.2295,
  },
  {
    id: 'place_manohar_dhaba',
    name: 'Manohar Dhaba (Japani Samosa)',
    category: 'Legendary Street Food',
    city: 'Chandni Chowk',
    reason: 'Operating since 1924, famous for its 60-layered crunchy Japani Samosa served with spicy chole & palak gravy.',
    must_see: '60-layer flaky pastry with rich spicy chickpea curry.',
    ticket_price: 'Approx ₹60-₹100',
    timings: '9:00 AM to 8:30 PM',
    rating: 4.7,
    lat: 28.6539,
    lng: 77.2372,
  },
  {
    id: 'place_shyam_sweets',
    name: 'Shree Shyam Sweets & Kanji Corner',
    category: 'Heritage Breakfast & Chaat',
    city: 'Old Delhi',
    reason: 'Famous for piping hot Bedmi Poori with spicy aloo sabzi, Nagori Halwa, and fermented Kanji Vada.',
    must_see: 'Morning Bedmi Poori breakfast and crispy Dahi Bhalle Papdi.',
    ticket_price: 'Approx ₹150 for two',
    timings: '8:00 AM to 10:00 PM',
    rating: 4.8,
    lat: 28.6562,
    lng: 77.2301,
  },
  {
    id: 'place_sarojini_nagar',
    name: 'Sarojini Nagar Market',
    category: 'Fashion & Bargain Market',
    city: 'South Delhi',
    reason: 'Delhi’s ultimate fashion haven for trendy clothes, shoes, and accessories at unbelievable bargain prices.',
    must_see: 'Export surplus lanes, jewelry stalls, and roadside momos.',
    ticket_price: 'Free entry',
    timings: '10:00 AM to 9:00 PM (Closed Mondays)',
    rating: 4.7,
  },
  {
    id: 'place_janpath',
    name: 'Janpath & Tibetan Market',
    category: 'Handicrafts & Boho Street Market',
    city: 'Connaught Place',
    reason: 'Famous for bohemian clothing, vintage brassware, Tibetan artifacts, and authentic street momos.',
    must_see: 'Silver jewelry row, antique craft kiosks, Depaul’s cold coffee.',
    ticket_price: 'Free entry',
    timings: '10:30 AM to 8:30 PM',
    rating: 4.7,
  },
  {
    id: 'place_dilli_haat',
    name: 'Dilli Haat (INA)',
    category: 'Craft Bazaar & Pan-Indian Food',
    city: 'South Delhi',
    reason: 'Open-air craft bazaar representing regional artisans and state food stalls from Kashmir to Kerala.',
    must_see: 'Sikkim momos, Bihar Litti Chokha, Kashmiri shawls, and handmade pottery.',
    ticket_price: 'INR 30',
    timings: '11:00 AM to 10:00 PM',
    rating: 4.8,
  },
  {
    id: 'place_andhra_bhavan',
    name: 'Andhra Bhavan Canteen',
    category: 'Authentic South Indian Thali',
    city: 'Central Delhi',
    reason: 'Legendary state canteen serving unlimited fiery Andhra thalis, Gongura mutton, and Hyderabadi biryani.',
    must_see: 'Sunday Hyderabadi Biryani lunch & unlimited traditional thali.',
    ticket_price: '₹200 - ₹350 per person',
    timings: '12:00 PM to 3:00 PM, 7:30 PM to 10:00 PM',
    rating: 4.8,
    lat: 28.6131,
    lng: 77.2283,
  },
];

// Rich Multi-Day Itineraries from keyword-itinerary.json, video-itinerary.json, sample1.json
export const SAMPLE_ITINERARIES: ItineraryItem[] = [
  {
    id: 'itin_delhi_foodie_shopping',
    title: '2-Day Delhi Heritage Street Food & Bargain Shopping',
    location: 'Delhi, India',
    budget: '₹5,000 Total Budget (Metro + Food + Shopping)',
    summary: 'A vibrant, budget-friendly 2-day itinerary for foodies and shoppers utilizing the super-efficient Delhi Metro to explore legendary street food trails and famous flea markets.',
    days: [
      {
        dayNumber: 1,
        title: 'Old Delhi Flavors & South Delhi Bargains',
        places: [
          {
            time: '09:00 AM',
            name: 'Chandni Chowk Breakfast (Shyam Sweets)',
            description: 'Start in the historic heart of Delhi with legendary Bedmi Poori and Nagori Halwa (₹150 for two). Grab a giant crispy jalebi from Old Famous Jalebi Wala.',
          },
          {
            time: '11:00 AM',
            name: 'Bargain Hunting at Sarojini Nagar Market',
            description: 'Hop on the Pink Line metro to Delhi’s fashion haven for trendy clothes, shoes, and accessories starting at ₹50–₹100.',
          },
          {
            time: '02:30 PM',
            name: 'Connaught Place & Janpath Lunch',
            description: 'Iconic Rajma Chawal at Shankar Market and famous bottled cold coffee with momos at Depaul’s Janpath.',
          },
          {
            time: '03:30 PM',
            name: 'Janpath Street Shopping',
            description: 'Bohemian clothes, oxidized silver jewelry, Tibetan singing bowls, and brass artifacts.',
          },
          {
            time: '06:00 PM',
            name: 'Evening Vibes & State Dinners at Dilli Haat INA',
            description: 'Explore regional handlooms and eat authentic pork momos at the Sikkim stall or hot Litti Chokha at the Bihar pavilion.',
          },
        ],
      },
      {
        dayNumber: 2,
        title: 'Tibetan Vibes & East Delhi Treasures',
        places: [
          {
            time: '10:00 AM',
            name: 'Breakfast & Monasteries in Majnu Ka Tilla (MKT)',
            description: 'Explore Delhi’s "Little Tibet" with prayer flags, hearty breakfast at Ama Cafe (Himalayan teas & pancakes), and spicy street Laphing.',
          },
          {
            time: '12:30 PM',
            name: 'Quirky Alley Shopping in MKT',
            description: 'Shop for Korean and Tibetan oversized streetwear, sneakers, incense, and curated accessories.',
          },
          {
            time: '03:00 PM',
            name: 'Karkardooma Market Boutique Spree',
            description: 'East Delhi’s stylish shopping and hangout market for designer duplicates and trendy footwear.',
          },
          {
            time: '05:30 PM',
            name: 'Street Food Feast in Karkardooma',
            description: 'Indulge in famous Malai Chaap at Veer Ji Malai Chaap Wale followed by pocket-friendly waffles and thick shakes.',
          },
          {
            time: '08:00 PM',
            name: 'Sweet Souvenir Ending',
            description: 'Pack freshly made Kaju Katli and Dhoda Burfi from local heritage halwais.',
          },
        ],
      },
    ],
    tips: [
      'Use a Delhi Metro Smart Card to save 20% on travel fares',
      'Keep cash handy for street vendors in Sarojini Nagar and Chandni Chowk',
      'Wear comfortable walking shoes for market navigation',
    ],
    recommendedPlaces: [
      { name: 'Ishaara', reason: 'Restaurant with hearing and speech impaired staff', type: 'food' },
      { name: 'Shyam Sweets', reason: 'Century-old Bedmi Poori institution', type: 'food' },
      { name: 'Sarojini Nagar Market', reason: 'Ultimate fashion bargains', type: 'shopping' },
    ],
  },
  {
    id: 'itin_chandni_chowk_food_trail',
    title: 'Iconic Heritage Street Food Trail in Chandni Chowk',
    location: 'Chandni Chowk, Old Delhi',
    budget: '₹800 per person',
    summary: 'An iconic culinary walk through the bustling lanes of Old Delhi, tasting 60-layered samosas, spicy potato curries, and fermented kanji.',
    days: [
      {
        dayNumber: 1,
        title: 'Old Delhi Culinary Trail',
        places: [
          {
            time: '09:00 AM',
            name: 'Bedmi Poori Wala (Bhagirath Palace)',
            description: 'Crispy lentil-stuffed pooris paired with spicy hing-infused potato curry.',
          },
          {
            time: '11:00 AM',
            name: 'Shri Shyam Kanji Corner (Khidki Wale)',
            description: 'Famous 30+ year old window shop serving refreshing fermented Kanji Vada and Dahi Bhalle Papdi.',
          },
          {
            time: '01:00 PM',
            name: 'Manohar Dhaba (Lajpat Rai Market)',
            description: 'Operating since 1924, famous for its 60-layered flaky Japani Samosa served with spicy chole and palak gravy.',
          },
          {
            time: '03:30 PM',
            name: 'Mukesh Chaat Bhandar',
            description: 'Ultra-crispy, golden Desi Ghee Aloo Tikki served with zesty sweet and tangy chutneys.',
          },
          {
            time: '05:00 PM',
            name: 'Meetha Paan Stall (Main Square)',
            description: 'Sweet, aromatic digestive betel leaf paan to conclude the royal culinary journey.',
          },
        ],
      },
    ],
  },
  {
    id: 'itin_jaipur_royal_heritage',
    title: '3-Day Royal Heritage & Food in Jaipur',
    location: 'Jaipur, Rajasthan',
    budget: '₹6,500 Total Budget (Forts + Dining + Transport)',
    summary: 'A curated 3-day royal heritage journey through the Pink City exploring hill forts, palace courtyards, traditional Rajasthani thalis, and bustling bazaars.',
    days: [
      {
        dayNumber: 1,
        title: 'Hill Forts & Sunsets',
        places: [
          {
            time: '09:00 AM',
            name: 'Amer Fort (Sheesh Mahal)',
            description: 'Explore the grand Mughal-Rajput fortress, the mirror palace Sheesh Mahal, and panoramic views of Maota Lake.',
          },
          {
            time: '11:30 AM',
            name: 'Jaigarh Fort',
            description: 'Witness the colossal Jaivana cannon on wheels and walk along the ancient hilltop defense walls.',
          },
          {
            time: '01:30 PM',
            name: 'Rajasthani Thali at LMB',
            description: 'Authentic Dal Baati Churma, Gatte ki Sabzi, and Ker Sangri in the heart of Johari Bazaar.',
          },
          {
            time: '03:30 PM',
            name: 'Jal Mahal (Water Palace)',
            description: 'Scenic photo stop at the picturesque yellow sandstone palace floating peacefully in Man Sagar Lake.',
          },
          {
            time: '05:30 PM',
            name: 'Sunset at Nahargarh Fort',
            description: 'Breathtaking golden hour panorama over the entire Pink City skyline from the fortress edge.',
          },
        ],
      },
      {
        dayNumber: 2,
        title: 'Palaces & Bazaars',
        places: [
          {
            time: '09:30 AM',
            name: 'City Palace Jaipur',
            description: 'Marvel at the royal courtyards, Maharaja museum, and the iconic Peacock Gate (Mor Chowk).',
          },
          {
            time: '11:30 AM',
            name: 'Jantar Mantar Observatory',
            description: 'UNESCO World Heritage astronomical complex featuring the world’s largest stone sundial.',
          },
          {
            time: '01:00 PM',
            name: 'Legendary Lassiwala (MI Road)',
            description: 'Cool off with thick, creamy malai lassi served in traditional eco-friendly clay kulhads.',
          },
          {
            time: '03:00 PM',
            name: 'Hawa Mahal (Palace of Winds)',
            description: 'Iconic pink facade with 953 ornate honeycomb windows designed for royal breezes.',
          },
          {
            time: '05:00 PM',
            name: 'Johari & Bapu Bazaar',
            description: 'Shop for Jaipuri bandhani sarees, handcrafted gemstone jewelry, and camel-leather juttis.',
          },
        ],
      },
      {
        dayNumber: 3,
        title: 'Arts & Village Feast',
        places: [
          {
            time: '10:00 AM',
            name: 'Albert Hall Museum',
            description: 'Magnificent Indo-Saracenic museum housing royal artifacts, miniature paintings, and rare carpets.',
          },
          {
            time: '12:30 PM',
            name: 'Rawat Mishthan Bhandar',
            description: 'Taste the world-famous piping hot crispy Pyaaz Kachori and sweet Mawa Kachori.',
          },
          {
            time: '03:00 PM',
            name: 'Birla Mandir Jaipur',
            description: 'Peaceful white marble temple dedicated to Lord Vishnu and Goddess Lakshmi nestled below Moti Dungri.',
          },
          {
            time: '06:00 PM',
            name: 'Chokhi Dhani Cultural Resort',
            description: 'Immersive Rajasthani village experience with folk music, fire dancers, puppet shows, and a royal feast.',
          },
        ],
      },
    ],
    tips: [
      'Get the Jaipur Composite Entry Ticket to save 50% across Amer, Albert Hall, Nahargarh, and Jantar Mantar.',
      'Visit Hawa Mahal from across the street cafe for the ultimate front-elevation photo.',
      'Bargain politely in Bapu Bazaar for handicrafts and leather mojaris.',
    ],
    recommendedPlaces: [
      { name: 'Amer Fort', reason: 'Magnificent mirror palace and hill views', type: 'attraction' },
      { name: 'City Palace', reason: 'Royal residence & museum', type: 'attraction' },
      { name: 'Lassiwala', reason: 'Iconic 1944 earthen kulhad lassi', type: 'food' },
      { name: 'Nahargarh Fort', reason: 'Epic sunset viewpoint over Pink City', type: 'attraction' },
      { name: 'Rawat Mishthan Bhandar', reason: 'Legendary crispy Pyaaz Kachori', type: 'food' },
    ],
  },
  {
    id: 'itin_udaipur_lakeside',
    title: '3-Day Lakeside Cafes & Sunsets in Udaipur',
    location: 'Udaipur, Rajasthan',
    budget: '₹7,500 Total Budget (Boats + Cafes + Palaces)',
    summary: 'A scenic 3-day romantic and relaxing itinerary enjoying lakeside dining, palace architecture, sunset boat rides, and cultural dance shows in the City of Lakes.',
    days: [
      {
        dayNumber: 1,
        title: 'Lakeside Heritage & Sunset Cruise',
        places: [
          {
            time: '09:30 AM',
            name: 'City Palace Udaipur',
            description: 'Grand palace complex overlooking Lake Pichola with crystal gallery and marble balconies.',
          },
          {
            time: '12:30 PM',
            name: 'Jagdish Temple',
            description: 'Ancient 1651 AD Indo-Aryan temple with intricate stone carvings right outside the palace gate.',
          },
          {
            time: '02:00 PM',
            name: 'Ambrai Lakeside Cafe',
            description: 'Scenic waterfront lunch with picture-perfect views of City Palace and Lake Pichola.',
          },
          {
            time: '05:00 PM',
            name: 'Lake Pichola Boat Cruise',
            description: 'Magical golden hour boat ride drifting past the floating Lake Palace and Jagmandir.',
          },
          {
            time: '07:00 PM',
            name: 'Bagore Ki Haveli Folk Show',
            description: 'Evening Dharohar cultural performance featuring Rajasthani folk dances and puppet theater.',
          },
        ],
      },
      {
        dayNumber: 2,
        title: 'Gardens, Lakes & Hilltop Forts',
        places: [
          {
            time: '10:00 AM',
            name: 'Saheliyon-ki-Bari',
            description: 'Historic royal garden with lotus pools, marble pavilions, and cascading fountains.',
          },
          {
            time: '01:00 PM',
            name: 'Fatehsagar Lake & Cafe',
            description: 'Breezy lakeside walk and cold coffee along the scenic Fatehsagar promenade.',
          },
          {
            time: '04:30 PM',
            name: 'Monsoon Palace (Sajjangarh)',
            description: 'Hilltop fortress offering dramatic 360-degree sunset views of the Aravalli hills and lakes.',
          },
          {
            time: '07:30 PM',
            name: 'Upre Rooftop Dining',
            description: 'Romantic candlelit dinner with illuminated views of the City Palace across the lake.',
          },
        ],
      },
      {
        dayNumber: 3,
        title: 'Island Palaces & Art Bazaars',
        places: [
          {
            time: '09:30 AM',
            name: 'Jagmandir Island Palace',
            description: 'Historic island palace garden retreat surrounded by sparkling lake waters.',
          },
          {
            time: '12:30 PM',
            name: 'Shilpgram Rural Arts Complex',
            description: 'Living ethnographic craft village showcasing rural artisans, pottery, and weaving.',
          },
          {
            time: '03:30 PM',
            name: 'Hathipole Art Bazaar',
            description: 'Shop for authentic Pichwai paintings, silver ornaments, and wooden handicrafts.',
          },
          {
            time: '06:00 PM',
            name: 'Gangaur Ghat Stroll',
            description: 'Peaceful waterfront ghat steps to soak in the evening breeze and gentle temple bells.',
          },
        ],
      },
    ],
    tips: [
      'Book the Bagore Ki Haveli Dharohar dance tickets in advance at 5 PM for the 7 PM show.',
      'Take the Lake Pichola boat ride from Rameshwar Ghat for best seating.',
    ],
    recommendedPlaces: [
      { name: 'City Palace Udaipur', reason: 'Grandest palace complex in Rajasthan', type: 'attraction' },
      { name: 'Ambrai Ghat', reason: 'Most scenic waterfront cafe view', type: 'food' },
      { name: 'Lake Pichola', reason: 'Serene sunset boat ride', type: 'attraction' },
      { name: 'Monsoon Palace', reason: 'Hilltop castle sunset views', type: 'attraction' },
    ],
  },
];

/**
 * Filter places matching search query
 */
export function querySamplePlaces(query: string): PlaceItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SAMPLE_PLACES;

  return SAMPLE_PLACES.filter((p) => {
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.reason && p.reason.toLowerCase().includes(q)) ||
      (p.must_see && p.must_see.toLowerCase().includes(q))
    );
  });
}

/**
 * Find or generate matching itinerary based on prompt
 */
export function querySampleItinerary(prompt: string): ItineraryItem {
  const p = prompt.trim().toLowerCase();

  if (p.includes('jaipur') || p.includes('royal') || p.includes('heritage') || p.includes('fort')) {
    return SAMPLE_ITINERARIES[2];
  }

  if (p.includes('udaipur') || p.includes('lake') || p.includes('cafe') || p.includes('sunset')) {
    return SAMPLE_ITINERARIES[3];
  }

  if (p.includes('samosa') || p.includes('chaat') || p.includes('food trail') || p.includes('chandni')) {
    return SAMPLE_ITINERARIES[1];
  }

  return SAMPLE_ITINERARIES[0];
}

// Hero slide data — replace with API data in the future
export const heroSlides = [
  {
    id: 1,
    badge: "LIMITED TIME OFFER",
    title: "Luxury Furniture",
    titleHighlight: "Sale",
    subtitle: "Up to 60% OFF",
    description: "Premium furniture crafted for modern living. Discover pieces that bring comfort and elegance to your home.",
    buttonText: "Shop Now",
    buttonLink: "/products",
    category: "Living Room",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80"
  },
  {
    id: 2,
    badge: "NEW COLLECTION",
    title: "Modern Bedroom",
    titleHighlight: "Collection",
    subtitle: "Save up to 45%",
    description: "Luxury beds, wardrobes, and bedside tables designed for restful nights and elegant mornings.",
    buttonText: "Explore Bedroom",
    buttonLink: "/products?category=Bedroom",
    category: "Bedroom",
    image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=80"
  },
  {
    id: 3,
    badge: "FESTIVE OFFERS",
    title: "Elegant Dining",
    titleHighlight: "Collection",
    subtitle: "Festive Offers Live",
    description: "Curated dining sets and chairs for every family gathering. Stylish, durable, and timeless.",
    buttonText: "Shop Dining",
    buttonLink: "/products?category=Dining Room",
    category: "Dining Room",
    image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1600&q=80"
  },
  {
    id: 4,
    badge: "WORKSPACE DEALS",
    title: "Office Furniture",
    titleHighlight: "Sale",
    subtitle: "Professional Workspace",
    description: "Ergonomic chairs, standing desks, and storage solutions for productive workspaces.",
    buttonText: "Shop Office",
    buttonLink: "/products?category=Office",
    category: "Office",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80"
  },
  {
    id: 5,
    badge: "SUMMER SALE",
    title: "Outdoor",
    titleHighlight: "Collection",
    subtitle: "Summer Outdoor Sale",
    description: "Premium patio sets, lounge chairs, and garden furniture built to enjoy the outdoors.",
    buttonText: "Explore Outdoor",
    buttonLink: "/products?category=Outdoor",
    category: "Outdoor",
    image: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1600&q=80"
  }
];

// Category cards — links a visual card to a slide index
export const heroCategoryCards = [
  {
    id: 1,
    label: "Living Room",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    slideIndex: 0
  },
  {
    id: 2,
    label: "Bedroom",
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80",
    slideIndex: 1
  },
  {
    id: 3,
    label: "Dining Room",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
    slideIndex: 2
  },
  {
    id: 4,
    label: "Office",
    image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80",
    slideIndex: 3
  },
  {
    id: 5,
    label: "Study Room",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80",
    slideIndex: 4
  }
];

// Promotion strip data
export const promotionItems = [
  { id: 1, text: "Flat 10% OFF on all items" },
  { id: 2, text: "Free Installation" },
  { id: 3, text: "Summer Sale Live" },
  { id: 4, text: "Cashback Available" }
];

// Offer / benefit cards
import { Truck, CreditCard, Tag, ShieldCheck, Sparkles } from 'lucide-react';

export const offerCards = [
  {
    id: 1,
    Icon: Truck,
    title: "Free Delivery",
    subtitle: "Orders above ₹999"
  },
  {
    id: 2,
    Icon: CreditCard,
    title: "Bank Offers",
    subtitle: "10% Instant Discount"
  },
  {
    id: 3,
    Icon: Tag,
    title: "No Cost EMI",
    subtitle: "Starting ₹2,499/month"
  },
  {
    id: 4,
    Icon: ShieldCheck,
    title: "Premium Warranty",
    subtitle: "2 Years Included"
  },
  {
    id: 5,
    Icon: Sparkles,
    title: "New Arrivals",
    subtitle: "Explore Latest",
    badge: "New"
  }
];

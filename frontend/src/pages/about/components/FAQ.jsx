import React, { useState } from'react';
import HomeSection from'../../../components/layout/HomeSection';
import { ChevronDown, ChevronUp } from'lucide-react';

const FAQ = () => {
 const faqs = [
 {
 question:"Where are your products manufactured?",
 answer:"Most of our products are manufactured in our state-of-the-art facilities located in North America and Europe. We also partner with select global artisans for specific handcrafted collections."
 },
 {
 question:"Do you offer interior design services?",
 answer:"Yes, we offer complimentary design consultations for our customers. Our experts can help you select pieces that fit your space, style, and budget perfectly."
 },
 {
 question:"What is your return policy?",
 answer:"We offer a 30-day hassle-free return policy on all standard items. Custom or made-to-order pieces are subject to a 20% restocking fee. Items must be in their original condition."
 },
 {
 question:"How long does shipping usually take?",
 answer:"In-stock items typically ship within 3-5 business days. For made-to-order items, please allow 4-6 weeks for production and delivery. You can track your order status in your account."
 }
 ];

 const [openIndex, setOpenIndex] = useState(0);

 return (
 <HomeSection title="Frequently Asked Questions" subtitle="Everything you need to know">
 <div className="max-w-3xl mx-auto space-y-4">
 {faqs.map((faq, index) => (
 <div 
 key={index} 
 className="border border-border-light rounded-2xl overflow-hidden bg-white shadow-sm transition-all"
 >
 <button
 className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
 onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
 >
 <span className="text-text-primary pr-4">{faq.question}</span>
 {openIndex === index ? (
 <ChevronUp className="w-5 h-5 text-brand-600 flex-shrink-0" />
 ) : (
 <ChevronDown className="w-5 h-5 text-text-muted flex-shrink-0 font-medium" />
 )}
 </button>
 <div 
 className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ?'pb-4 max-h-40 opacity-100' :'max-h-0 opacity-0'}`}
 >
 <p className="text-text-secondary">{faq.answer}</p>
 </div>
 </div>
 ))}
 </div>
 </HomeSection>
 );
};

export default FAQ;

import React from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaCalendar, FaClock, FaInstagram, FaTiktok, FaFacebookF, FaTwitter } from "react-icons/fa";
import { GiPerfumeBottle } from "react-icons/gi";
import "./blogpage.css";

export default function BlogPage() {
  const relatedPosts = [
    { id: 2, title: "The Art of Body Care", image: "https://images.unsplash.com/photo-1556228578-9c360e2d0b4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { id: 3, title: "Fragrance Layering 101", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { id: 4, title: "Best Summer Scents", image: "https://images.unsplash.com/photo-1587556930069-1b2d3b5c9c2e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
  ];

  return (
    <div className="blog-page">
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="blog-hero-overlay"></div>
        <div className="blog-hero-content">
          <Link to="/" className="back-link">
            <FaArrowLeft /> Back to Home
          </Link>
          <span className="blog-category">FRAGRANCE GUIDE</span>
          <h1>Choosing Your Signature Scent</h1>
          <div className="blog-meta">
            <span><FaCalendar /> December 14, 2025</span>
            <span><FaClock /> 8 min read</span>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="blog-content">
        <div className="blog-container">
          <div className="blog-intro">
            <p className="lead-text">
              Finding your signature scent is a deeply personal journey. It's about discovering a fragrance that not only smells beautiful but also resonates with your personality, lifestyle, and the impression you want to leave. Let's explore how to find the perfect fragrance that truly represents you.
            </p>
          </div>

          <div className="blog-section">
            <h2>Understanding Fragrance Families</h2>
            <p>
              Perfumes are typically categorized into several main fragrance families, each with its own distinct characteristics and mood. Understanding these families is the first step in narrowing down your search.
            </p>
            
            <div className="fragrance-families">
              <div className="family-card">
                <h3>Floral</h3>
                <p>Romantic, feminine, and timeless. Perfect for those who love classic elegance.</p>
              </div>
              <div className="family-card">
                <h3>Oriental</h3>
                <p>Warm, spicy, and exotic. Ideal for evening wear and special occasions.</p>
              </div>
              <div className="family-card">
                <h3>Woody</h3>
                <p>Earthy, grounding, and sophisticated. Great for those who prefer subtle luxury.</p>
              </div>
              <div className="family-card">
                <h3>Fresh</h3>
                <p>Clean, citrusy, and energizing. Perfect for everyday wear and warmer weather.</p>
              </div>
            </div>
          </div>

          <div className="blog-image-section">
            <img src="https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Perfume bottles" />
            <p className="image-caption">A collection of signature fragrances from our curated selection</p>
          </div>

          <div className="blog-section">
            <h2>Know Your Personal Style</h2>
            <p>
              Your signature scent should be an extension of your personality. Consider these questions when shopping for a new fragrance:
            </p>
            <ul className="blog-list">
              <li>What's your daily style? Casual, professional, or glamorous?</li>
              <li>What environments do you spend most of your time in?</li>
              <li>Do you prefer subtle sophistication or bold statements?</li>
              <li>What memories or emotions do you want your scent to evoke?</li>
              <li>Are you drawn to nature-inspired or synthetic modern scents?</li>
            </ul>
          </div>

          <div className="blog-quote">
            <GiPerfumeBottle className="quote-icon" />
            <p>"A woman's perfume tells more about her than her handwriting."</p>
            <span>— Christian Dior</span>
          </div>

          <div className="blog-section">
            <h2>The Art of Testing Fragrances</h2>
            <p>
              Testing perfumes properly is crucial to finding your perfect match. Here's how to do it right:
            </p>
            
            <div className="tips-grid">
              <div className="tip-card">
                <h4>1. Test on Your Skin</h4>
                <p>Never judge a fragrance from the bottle or paper strip alone. Your skin chemistry affects how a scent develops.</p>
              </div>
              <div className="tip-card">
                <h4>2. Give It Time</h4>
                <p>Wait at least 30 minutes to experience the true character of a perfume as it settles into your skin.</p>
              </div>
              <div className="tip-card">
                <h4>3. Test Maximum 3</h4>
                <p>Don't overwhelm your senses. Test no more than three fragrances at a time for accurate assessment.</p>
              </div>
              <div className="tip-card">
                <h4>4. Return Later</h4>
                <p>Come back to the fragrance after a few hours to see how it evolves throughout the day.</p>
              </div>
            </div>
          </div>

          <div className="blog-section">
            <h2>Understanding Fragrance Notes</h2>
            <p>
              Every perfume is composed of three layers of notes that reveal themselves over time. Understanding this structure will help you appreciate how a fragrance evolves on your skin.
            </p>
            <div className="notes-section">
              <div className="note-card">
                <h4>Top Notes (0-15 minutes)</h4>
                <p>The first impression—light, fresh, and volatile. Common top notes include citrus, herbs, and light fruits. These are what you smell immediately upon application.</p>
              </div>
              <div className="note-card">
                <h4>Heart Notes (15 minutes - 3 hours)</h4>
                <p>The true personality of the fragrance. Usually floral, fruity, or spicy scents that emerge once the top notes fade. This is the core of your perfume.</p>
              </div>
              <div className="note-card">
                <h4>Base Notes (3+ hours)</h4>
                <p>The lasting foundation—deep, rich, and long-lasting. Includes woods, musks, amber, and vanilla. These linger on your skin throughout the day.</p>
              </div>
            </div>
          </div>

          <div className="blog-section">
            <h2>Seasonal Considerations</h2>
            <p>
              While you can wear any fragrance you love year-round, certain scents are better suited to different seasons. Understanding seasonal fragrance selection can help you build a versatile collection.
            </p>
            
            <div className="seasonal-grid">
              <div className="seasonal-card">
                <h4>Spring</h4>
                <p>Opt for fresh florals, green notes, and light fruits. Think cherry blossoms, fresh-cut grass, and morning dew. These scents mirror the renewal of nature.</p>
              </div>
              <div className="seasonal-card">
                <h4>Summer</h4>
                <p>Choose citrus, aquatic, and tropical fragrances. Light, refreshing scents like bergamot, coconut, and sea breeze work best in the heat without overwhelming.</p>
              </div>
              <div className="seasonal-card">
                <h4>Autumn</h4>
                <p>Embrace spicy, woody, and gourmand notes. Cinnamon, amber, sandalwood, and vanilla create warmth and comfort as the weather cools.</p>
              </div>
              <div className="seasonal-card">
                <h4>Winter</h4>
                <p>Go for rich orientals, deep woods, and musks. Bold, long-lasting scents like patchouli, oud, and incense provide warmth and luxury in cold months.</p>
              </div>
            </div>
          </div>

          <div className="blog-section">
            <h2>Common Fragrance Mistakes to Avoid</h2>
            <p>
              Even experienced perfume lovers can fall into these common traps. Here's what to watch out for:
            </p>
            <ul className="blog-list">
              <li><strong>Rubbing your wrists together</strong> — This breaks down the fragrance molecules and alters the scent. Simply dab and let it dry naturally.</li>
              <li><strong>Storing in the bathroom</strong> — Heat and humidity degrade perfumes. Keep them in a cool, dry place away from direct sunlight.</li>
              <li><strong>Applying to dry skin</strong> — Moisturized skin holds fragrance better. Apply unscented lotion first for maximum longevity.</li>
              <li><strong>Over-applying</strong> — Less is more. Start with 2-3 spritzes and add more only if needed. Others should discover your scent, not be overwhelmed by it.</li>
              <li><strong>Buying without testing</strong> — Never purchase based on smell strips alone. Always test on your skin and give it time to develop.</li>
            </ul>
          </div>

          <div className="blog-image-section">
            <img src="https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Woman applying perfume" />
            <p className="image-caption">The art of applying perfume: less is more, strategic placement is key</p>
          </div>

          <div className="blog-section">
            <h2>Building Your Fragrance Wardrobe</h2>
            <p>
              Just as you have different outfits for different occasions, your fragrance collection should be versatile. Here's a guide to building a well-rounded perfume wardrobe:
            </p>
            <div className="wardrobe-grid">
              <div className="wardrobe-item">
                <h4>Daily Signature (1-2 scents)</h4>
                <p>Your go-to fragrance that represents you. Choose something versatile that works for work, casual outings, and everyday life. This becomes your olfactory signature.</p>
              </div>
              <div className="wardrobe-item">
                <h4>Evening/Special Occasion (1 scent)</h4>
                <p>A more dramatic, luxurious fragrance for dates, formal events, or nights out. Usually richer and more complex than your daily wear.</p>
              </div>
              <div className="wardrobe-item">
                <h4>Fresh/Sport (1 scent)</h4>
                <p>A light, clean fragrance for the gym, outdoor activities, or hot days. Something refreshing that won't overpower in active situations.</p>
              </div>
              <div className="wardrobe-item">
                <h4>Seasonal Rotation (2-4 scents)</h4>
                <p>Fragrances that complement different times of year. Having seasonal options keeps your scent profile interesting and appropriate.</p>
              </div>
            </div>
          </div>

          <div className="blog-section">
            <h2>Making It Uniquely Yours</h2>
            <p>
              Once you've found your signature scent, here are professional tips to maximize its impact and longevity:
            </p>
            <ul className="blog-list">
              <li><strong>Layer strategically</strong> — Start with scented body wash, follow with lotion, then perfume. This creates depth and extends wear time significantly.</li>
              <li><strong>Target pulse points</strong> — Apply to warm areas: wrists, neck, behind ears, inside elbows, and behind knees. Body heat helps diffuse the scent naturally.</li>
              <li><strong>Spray your hair</strong> — Hair holds fragrance beautifully. Spray lightly on your brush or directly on hair ends for a subtle scent trail.</li>
              <li><strong>Create a signature ritual</strong> — Apply your perfume the same way each time. This consistency creates a powerful personal association.</li>
              <li><strong>Refresh midday</strong> — Carry a travel atomizer for touch-ups. A light spritz on wrists or clothing can revive your scent.</li>
              <li><strong>Store properly</strong> — Keep bottles in original packaging, away from heat and light. Proper storage can extend perfume life by years.</li>
              <li><strong>Embrace versatility</strong> — Having 2-3 signature scents for different moods and occasions adds depth to your personal brand.</li>
            </ul>
          </div>

          <div className="blog-section">
            <h2>The Psychology of Scent</h2>
            <p>
              Fragrance isn't just about smelling good—it's deeply connected to memory, emotion, and perception. Research shows that scent is the sense most closely linked to memory and can instantly transport you to specific moments in time.
            </p>
            <p>
              Your signature scent becomes part of how people remember you. Choose wisely, wear it consistently, and it will become an invisible but unforgettable part of your presence. The right fragrance can boost confidence, create lasting impressions, and become a powerful tool for self-expression.
            </p>
            <p>
              When someone catches a whiff of your perfume months or years later, they'll think of you. That's the true magic of finding your perfect signature scent—it becomes an extension of who you are.
            </p>
          </div>

          <div className="blog-cta">
            <GiPerfumeBottle className="cta-icon" />
            <h3>Ready to Find Your Signature Scent?</h3>
            <p>Explore our curated collection of luxury fragrances and discover the perfect scent that tells your story.</p>
            <Link to="/shop" className="cta-button">SHOP PERFUMES</Link>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="related-posts">
        <div className="blog-container">
          <h2>Continue Reading</h2>
          <div className="related-grid">
            {relatedPosts.map((post) => (
              <div className="related-card" key={post.id}>
                <div className="related-image" style={{ backgroundImage: `url(${post.image})` }}></div>
                <h3>{post.title}</h3>
                <Link to={`/blog/${post.id}`} className="read-link">Read Article →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="blog-newsletter">
        <div className="newsletter-content">
          <GiPerfumeBottle className="newsletter-icon" />
          <h2>Never Miss a Story</h2>
          <p>Subscribe to our newsletter for fragrance tips, guides, and exclusive offers</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email address" />
            <button>Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="blog-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Shop</h4>
            <Link to="/perfumes">Perfumes</Link>
            <Link to="/soaps">Artisan Soaps</Link>
            <Link to="/body-mists">Body Mists</Link>
            <Link to="/scrubs">Body Scrubs</Link>
          </div>
          
          <div className="footer-section">
            <h4>Information</h4>
            <Link to="/about">Our Story</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social">
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="TikTok"><FaTiktok /></a>
              <a href="#" aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
            </div>
            <div className="contact-info">
              <p>📧 hello@gildandgrove.com</p>
              <p>📞 +63 912 345 6789</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 GILD + GROVE. Luxury Fragrances & Body Care.</p>
        </div>
      </footer>
    </div>
  );
}
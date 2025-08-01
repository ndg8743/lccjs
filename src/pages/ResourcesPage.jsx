import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store/AppStore';
import Button from '../components/ui/Button';
import Header from '../components/Header';

/**
 * Resources page component displaying useful LCC learning materials
 */
function ResourcesPage() {
  const { isDarkMode, toggleDarkMode } = useApp();
  const [showFileSidebar, setShowFileSidebar] = useState(false);
  const [showReference, setShowReference] = useState(false);

  // Set dark mode on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.className = isDarkMode
      ? 'bg-gray-900 text-gray-100 min-h-screen'
      : 'bg-gray-50 text-gray-900 min-h-screen';
  }, [isDarkMode]);

  const resources = [
    {
      category: 'Essential Textbook',
      items: [
        {
          name: 'C Under the Hood - 2nd Edition',
          url: 'https://www.amazon.com/C-Under-Hood-2nd/dp/B09B74P6C4/?_encoding=UTF8&pd_rd_w=GAtu8&content-id=amzn1.sym.0fb2cce1-1ca4-439a-844b-8ad0b1fb77f7&pf_rd_p=0fb2cce1-1ca4-439a-844b-8ad0b1fb77f7&pf_rd_r=144-0676740-8945539&pd_rd_wg=SByNU&pd_rd_r=66a1d4b3-b269-4f8e-9944-0a984d194b56&ref_=aufs_ap_sc_dsk',
          description: 'The official textbook for this course. Essential reading for understanding C programming, assembly language, and computer architecture. Covers memory management, pointers, and low-level programming concepts.',
          icon: 'fas fa-book-open'
        }
      ]
    },
    {
      category: 'LCC Implementations',
      items: [
        {
          name: 'LCC for Windows',
          filename: 'cuh63Windows.zip',
          size: '10MB',
          description: 'Complete LCC compiler and interpreter for Windows systems. Includes all necessary tools for assembly programming on Windows.',
          icon: 'fab fa-windows'
        },
        {
          name: 'LCC for macOS (Intel)',
          filename: 'cuh63MacIntel.zip',
          size: '10MB',
          description: 'LCC compiler and interpreter for Intel-based Mac computers. Compatible with older MacBooks and iMacs.',
          icon: 'fab fa-apple'
        },
        {
          name: 'LCC for macOS (ARM)',
          filename: 'cuh63MacArm.zip',
          size: '10MB',
          description: 'LCC compiler and interpreter optimized for Apple Silicon (M1/M2/M3) Macs. Best performance on newer Mac hardware.',
          icon: 'fab fa-apple'
        },
        {
          name: 'LCC for Linux',
          filename: 'cuh63Linux.zip',
          size: '10MB',
          description: 'LCC compiler and interpreter for Linux distributions. Works on Ubuntu, Debian, Fedora, and other major distros.',
          icon: 'fab fa-linux'
        }
      ]
    },
    {
      category: 'Learning Materials',
      items: [
        {
          name: 'Data Structures Textbook',
          filename: 'Amazing Data Struct Textbook.pdf',
          size: '1.9MB',
          description: 'Comprehensive textbook covering essential data structures including linked lists, trees, graphs, and their implementation.',
          icon: 'fas fa-book'
        }
      ]
    },
    {
      category: 'Online Resources',
      items: [
        {
          name: 'Stanford CS Library - Pointers and Memory',
          url: 'http://cslibrary.stanford.edu/101/',
          description: 'Essential guide to understanding pointers, memory allocation, and low-level programming concepts crucial for assembly programming.',
          icon: 'fas fa-graduation-cap'
        },
        {
          name: 'C Programming Video Tutorial',
          url: 'https://youtu.be/2ciUcosJFBc',
          description: 'Video tutorial covering C language fundamentals and practical programming techniques.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'OSDev Wiki - System Programming Tutorials',
          url: 'https://wiki.osdev.org/Tutorials',
          description: 'Collection of tutorials on operating system development, low-level programming, and system architecture.',
          icon: 'fas fa-microchip'
        }
      ]
    },
    {
      category: 'YouTube Channels',
      items: [
        {
          name: 'Low Level Learning',
          url: 'https://www.youtube.com/lowlevellearning',
          description: 'Deep dives into systems programming, assembly, C/C++, and computer architecture. Perfect for understanding how computers work at the hardware level.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'Theo (t3.gg)',
          url: 'https://www.youtube.com/@t3dotgg',
          description: 'Full-stack development insights, web technologies, and programming best practices with a focus on modern JavaScript and TypeScript.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'ThePrimeagen',
          url: 'https://www.youtube.com/@ThePrimeagen',
          description: 'Vim mastery, performance optimization, and software engineering wisdom. Great for learning efficient coding practices and system design.',
          icon: 'fab fa-youtube'
        },
        {
          name: '3Blue1Brown',
          url: 'https://www.youtube.com/@3blue1brown',
          description: 'Beautiful mathematical visualizations that explain complex concepts intuitively. Essential for understanding algorithms and computational theory.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'Bro Code',
          url: 'https://www.youtube.com/@BroCodez',
          description: 'Comprehensive programming tutorials covering multiple languages and concepts. Great for beginners and intermediate programmers.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'Fireship',
          url: 'https://www.youtube.com/@Fireship',
          description: 'Fast-paced, modern web development tutorials. Learn cutting-edge technologies in 100 seconds or detailed project builds.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'The Coding Sloth',
          url: 'https://www.youtube.com/@TheCodingSloth',
          description: 'Web development tutorials with a focus on practical projects. Great for learning by building real-world applications.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'NetworkChuck',
          url: 'https://www.youtube.com/@NetworkChuck',
          description: 'Networking, cybersecurity, and IT tutorials. Learn about systems administration and security concepts relevant to low-level programming.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'Professor Messer',
          url: 'https://www.youtube.com/@ProfessorMesser',
          description: 'CompTIA certification training and IT fundamentals. Excellent for understanding computer hardware and system architecture.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'Jeff Geerling',
          url: 'https://www.youtube.com/@JeffGeerling',
          description: 'DevOps, Raspberry Pi projects, and infrastructure automation. Great for learning about systems and embedded programming.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'Code Bullet',
          url: 'https://www.youtube.com/@CodeBullet',
          description: 'AI and machine learning projects with entertaining commentary. Learn algorithms and problem-solving through creative coding challenges.',
          icon: 'fab fa-youtube'
        },
        {
          name: 'freeCodeCamp.org',
          url: 'https://www.youtube.com/@freecodecamp',
          description: 'Full-length programming courses on every topic imaginable. Comprehensive tutorials perfect for deep learning sessions.',
          icon: 'fab fa-youtube'
        }
      ]
    }
  ];

  const handleDownload = (filename) => {
    const link = document.createElement('a');
    link.href = `/lcc_packages+files/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <Header 
        showFileSidebar={showFileSidebar}
        onToggleFileSidebar={() => setShowFileSidebar(!showFileSidebar)}
        showReference={showReference}
        onToggleReference={() => setShowReference(!showReference)}
      />
      
      {/* Resources Sub-Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Learning Resources</h2>
          <Button
            onClick={() => window.location.href = '/'}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to IDE
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            LCC Learning Resources
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Download tools, read documentation, and explore tutorials to master LCC assembly programming
          </p>
        </motion.div>

        {/* Resources Sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {resources.map((section, sectionIndex) => (
            <motion.div
              key={section.category}
              variants={itemVariants}
              className="mb-8"
            >
              <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {section.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.name}
                    className={`rounded-lg shadow-lg overflow-hidden ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <i className={`${item.icon} text-2xl ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}></i>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">
                            {item.name}
                          </h3>
                          
                          {item.size && (
                            <p className="text-sm text-gray-500 mb-2">
                              Size: {item.size}
                            </p>
                          )}
                          
                          <p className={`mb-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {item.description}
                          </p>
                          
                          {item.filename ? (
                            <motion.button
                              onClick={() => handleDownload(item.filename)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <i className="fas fa-download mr-2"></i>
                              Download
                            </motion.button>
                          ) : (
                            <motion.button
                              onClick={() => handleOpenLink(item.url)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                isDarkMode
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <i className="fas fa-external-link-alt mr-2"></i>
                              Visit Site
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`mt-12 p-6 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            <i className={`fas fa-info-circle mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}></i>
            Getting Started with LCC
          </h3>
          <ol className={`list-decimal list-inside space-y-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <li>Download the appropriate LCC implementation for your operating system</li>
            <li>Extract the ZIP file to a directory of your choice</li>
            <li>Add the LCC directory to your system's PATH environment variable</li>
            <li>Read the Data Structures textbook for theoretical foundations</li>
            <li>Watch the video tutorial for practical examples</li>
            <li>Explore the Stanford CS Library for deeper understanding of memory management</li>
            <li>Visit OSDev Wiki for advanced system programming concepts</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}

export default ResourcesPage;
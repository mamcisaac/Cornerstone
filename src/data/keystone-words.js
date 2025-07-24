// Keystone words for puzzle generation - all must be exactly 12 letters
// These words will be treated as cornerstone words in their respective puzzles

const KEYSTONE_WORDS = {
    "CORNERSTONES": {
        word: "CORNERSTONES",
        definition: "The fundamental or most important parts; foundation stones of a building placed at corners"
    },
    "PROFESSIONAL": {
        word: "PROFESSIONAL",
        definition: "Relating to or belonging to a profession; competent, skilled, or assured"
    },
    "APPLICATIONS": {
        word: "APPLICATIONS",
        definition: "Formal requests; practical uses of ideas, theories, or discoveries; software programs"
    },
    "REQUIREMENTS": {
        word: "REQUIREMENTS",
        definition: "Things that are needed or demanded; necessary conditions"
    },
    "CONSTRUCTION": {
        word: "CONSTRUCTION",
        definition: "The building of something, typically a large structure"
    },
    "AVAILABILITY": {
        word: "AVAILABILITY",
        definition: "The quality of being able to be used or obtained; accessibility"
    },
    "ORGANIZATION": {
        word: "ORGANIZATION",
        definition: "An organized group of people with a particular purpose, such as a business"
    },
    "REGISTRATION": {
        word: "REGISTRATION",
        definition: "The action of registering; being entered on an official list"
    },
    "DISTRIBUTION": {
        word: "DISTRIBUTION",
        definition: "The action of sharing something out among a number of recipients"
    },
    "PUBLICATIONS": {
        word: "PUBLICATIONS",
        definition: "Books, journals, newspapers, or other printed or digital material made available publicly"
    },
    "INTRODUCTION": {
        word: "INTRODUCTION",
        definition: "The action of introducing something; a formal presentation of one person to another"
    },
    "TECHNOLOGIES": {
        word: "TECHNOLOGIES",
        definition: "Applications of scientific knowledge for practical purposes in industry"
    },
    "MANUFACTURER": {
        word: "MANUFACTURER",
        definition: "A person or company that makes goods for sale, especially in a factory"
    },
    "INSTRUCTIONS": {
        word: "INSTRUCTIONS",
        definition: "Detailed information telling how something should be done, operated, or assembled"
    },
    "RELATIONSHIP": {
        word: "RELATIONSHIP",
        definition: "The way in which two or more people or things are connected or related"
    },
    "INSTALLATION": {
        word: "INSTALLATION",
        definition: "The action of installing something; a large piece of equipment installed for use"
    },
    "PARTICULARLY": {
        word: "PARTICULARLY",
        definition: "To a higher degree than is usual or average; especially"
    },
    "ARCHITECTURE": {
        word: "ARCHITECTURE",
        definition: "The art and science of designing and constructing buildings and structures"
    },
    "PRESENTATION": {
        word: "PRESENTATION",
        definition: "The proffering or giving of something to someone; a formal talk or display"
    },
    "PENNSYLVANIA": {
        word: "PENNSYLVANIA",
        definition: "A northeastern U.S. state, one of the original 13 colonies"
    },
    "INSTITUTIONS": {
        word: "INSTITUTIONS",
        definition: "Established organizations, especially those dedicated to education, public service, or culture"
    },
    "INTELLIGENCE": {
        word: "INTELLIGENCE",
        definition: "The ability to acquire and apply knowledge and skills; information gathering"
    },
    "PARTICIPANTS": {
        word: "PARTICIPANTS",
        definition: "People who take part in something; those involved in an activity or event"
    },
    "PHILADELPHIA": {
        word: "PHILADELPHIA",
        definition: "The largest city in Pennsylvania, known as the birthplace of American independence"
    },
    "COLLECTIBLES": {
        word: "COLLECTIBLES",
        definition: "Items worth collecting for their rarity, historical significance, or investment potential"
    },
    "SUBSCRIPTION": {
        word: "SUBSCRIPTION",
        definition: "An arrangement to receive regular deliveries of a publication or service"
    },
    "CONTEMPORARY": {
        word: "CONTEMPORARY",
        definition: "Living or occurring at the same time; belonging to the present time"
    },
    "PRESCRIPTION": {
        word: "PRESCRIPTION",
        definition: "An instruction written by a medical practitioner for the treatment of a patient"
    },
    "SPECIFICALLY": {
        word: "SPECIFICALLY",
        definition: "In a way that is exact and clear; particularly"
    },
    "CONSERVATION": {
        word: "CONSERVATION",
        definition: "The action of conserving something, especially the environment or cultural heritage"
    },
    "CERTIFICATES": {
        word: "CERTIFICATES",
        definition: "Official documents attesting to a status or level of achievement"
    },
    "ENCYCLOPEDIA": {
        word: "ENCYCLOPEDIA",
        definition: "A comprehensive reference work containing information on all branches of knowledge"
    },
    "RESERVATIONS": {
        word: "RESERVATIONS",
        definition: "Arrangements to have something held for one's use; doubts or concerns"
    },
    "COMPENSATION": {
        word: "COMPENSATION",
        definition: "Something, typically money, awarded to someone in recognition of loss, suffering, or injury"
    },
    "AGRICULTURAL": {
        word: "AGRICULTURAL",
        definition: "Relating to farming and the cultivation of land"
    },
    "TRANSMISSION": {
        word: "TRANSMISSION",
        definition: "The action or process of transmitting something; a vehicle's gear system"
    },
    "NEIGHBORHOOD": {
        word: "NEIGHBORHOOD",
        definition: "A district or community within a town or city; the area near a particular place"
    },
    "TRANSACTIONS": {
        word: "TRANSACTIONS",
        definition: "Instances of buying or selling; exchanges or interactions between people"
    },
    "ORGANISATION": {
        word: "ORGANISATION",
        definition: "British spelling of organization; a structured group of people working together"
    },
    "CONTRIBUTION": {
        word: "CONTRIBUTION",
        definition: "A gift or payment to a common fund or collection; the part played in bringing about a result"
    },
    "CONSTITUTION": {
        word: "CONSTITUTION",
        definition: "A body of fundamental principles according to which a state or organization is governed"
    },
    "CONSULTATION": {
        word: "CONSULTATION",
        definition: "A meeting to discuss something or to get advice; the action of consulting"
    },
    "SATISFACTION": {
        word: "SATISFACTION",
        definition: "Fulfillment of one's wishes, expectations, or needs; contentment"
    },
    "INTELLECTUAL": {
        word: "INTELLECTUAL",
        definition: "Relating to the intellect; a person possessing a highly developed intellect"
    },
    "EXPERIMENTAL": {
        word: "EXPERIMENTAL",
        definition: "Based on untested ideas or techniques; relating to scientific experiments"
    },
    "NOTIFICATION": {
        word: "NOTIFICATION",
        definition: "The action of notifying someone or something; a formal notice or announcement"
    },
    "UNIVERSITIES": {
        word: "UNIVERSITIES",
        definition: "Institutions of higher education and research, granting academic degrees"
    },
    "IMPROVEMENTS": {
        word: "IMPROVEMENTS",
        definition: "The process of making something better; enhancements or upgrades"
    },
    "ARRANGEMENTS": {
        word: "ARRANGEMENTS",
        definition: "Plans or preparations for a future event; the way things are organized"
    },
    "SUCCESSFULLY": {
        word: "SUCCESSFULLY",
        definition: "In a way that accomplishes a desired aim or result"
    },
    "REPRESENTING": {
        word: "REPRESENTING",
        definition: "Acting or speaking on behalf of someone; depicting or portraying"
    },
    "EXPECTATIONS": {
        word: "EXPECTATIONS",
        definition: "Strong beliefs that something will happen or be the case; anticipations"
    },
    "CONSEQUENCES": {
        word: "CONSEQUENCES",
        definition: "Results or effects of an action or condition, especially unwelcome ones"
    },
    "IMPLICATIONS": {
        word: "IMPLICATIONS",
        definition: "Conclusions that can be drawn from something; possible effects or results"
    },
    "DEMONSTRATED": {
        word: "DEMONSTRATED",
        definition: "Clearly showed the existence or truth of something by evidence or example"
    },
    "PHOTOGRAPHER": {
        word: "PHOTOGRAPHER",
        definition: "A person who takes photographs, especially as a profession"
    },
    "PERSPECTIVES": {
        word: "PERSPECTIVES",
        definition: "Particular attitudes toward or ways of regarding something; points of view"
    },
    "COMPETITIONS": {
        word: "COMPETITIONS",
        definition: "Events or contests in which people compete; rivalries between individuals or groups"
    },
    "ILLUSTRATION": {
        word: "ILLUSTRATION",
        definition: "A picture or diagram that explains or decorates; an example serving to clarify"
    },
    "CALCULATIONS": {
        word: "CALCULATIONS",
        definition: "Mathematical determinations of amounts or numbers; careful planning or forethought"
    },
    "COMBINATIONS": {
        word: "COMBINATIONS",
        definition: "Joining or merging of different parts or qualities; mathematical selections"
    },
    "EXAMINATIONS": {
        word: "EXAMINATIONS",
        definition: "Detailed inspections or analyses; formal tests of knowledge or ability"
    },
    "INCREASINGLY": {
        word: "INCREASINGLY",
        definition: "To an increasing extent; more and more"
    },
    "REPRODUCTION": {
        word: "REPRODUCTION",
        definition: "The process of producing copies; biological process of producing offspring"
    },
    "CHAMPIONSHIP": {
        word: "CHAMPIONSHIP",
        definition: "A contest for the position of champion in a sport or competition"
    },
    "THANKSGIVING": {
        word: "THANKSGIVING",
        definition: "A national holiday celebrating the harvest and blessings of the past year"
    },
    "CHAMPIONSHIPS": {
        word: "CHAMPIONSHIPS",
        definition: "Multiple contests for champion positions; tournament series"
    },
    "TEMPERATURES": {
        word: "TEMPERATURES",
        definition: "Degrees of heat or cold measured on a particular scale"
    },
    "SUBSEQUENTLY": {
        word: "SUBSEQUENTLY",
        definition: "After a particular thing has happened; afterward"
    },
    "ANNOUNCEMENT": {
        word: "ANNOUNCEMENT",
        definition: "A public or formal statement about something"
    },
    "OBSERVATIONS": {
        word: "OBSERVATIONS",
        definition: "Acts of watching carefully; comments based on something seen or noticed"
    },
    "CONNECTIVITY": {
        word: "CONNECTIVITY",
        definition: "The state of being connected; ability to connect to networks or systems"
    },
    "INTERACTIONS": {
        word: "INTERACTIONS",
        definition: "Reciprocal actions or influences between people or things"
    },
    "DESCRIPTIONS": {
        word: "DESCRIPTIONS",
        definition: "Spoken or written representations or accounts of something"
    },
    "CONSIDERABLY": {
        word: "CONSIDERABLY",
        definition: "By a notably large amount or to a notably large extent; greatly"
    },
    "ENCYCLOPEDIA": {
        word: "ENCYCLOPEDIA",
        definition: "A comprehensive reference work with articles on various topics"
    },
    "SHAREHOLDERS": {
        word: "SHAREHOLDERS",
        definition: "Owners of shares in a company; stockholders"
    },
    "INCORPORATED": {
        word: "INCORPORATED",
        definition: "Formed into a legal corporation; included as part of something"
    },
    "MEASUREMENTS": {
        word: "MEASUREMENTS",
        definition: "The size, length, or amount of something as established by measuring"
    },
    "CONSTITUTION": {
        word: "CONSTITUTION",
        definition: "The fundamental principles by which a state or organization is governed"
    },
    "SOPHISTICATED": {
        word: "SOPHISTICATED",
        definition: "Having great knowledge or experience; complex or advanced"
    },
    "APPROXIMATELY": {
        word: "APPROXIMATELY",
        definition: "Used to show that something is almost, but not completely, accurate"
    },
    "RESPECTIVELY": {
        word: "RESPECTIVELY",
        definition: "Separately and in the order already mentioned"
    },
    "DEVELOPMENTS": {
        word: "DEVELOPMENTS",
        definition: "The process of growth or progress; new events or products"
    },
    "ADMINISTERED": {
        word: "ADMINISTERED",
        definition: "Managed and organized; gave or applied something"
    },
    "NEVERTHELESS": {
        word: "NEVERTHELESS",
        definition: "In spite of that; however; nonetheless"
    },
    "BIBLIOGRAPHY": {
        word: "BIBLIOGRAPHY",
        definition: "A list of books and articles on a particular subject or by a particular author"
    },
    "PHOTOGRAPHER": {
        word: "PHOTOGRAPHER",
        definition: "A person who takes photographs professionally or as a hobby"
    },
    "ASSOCIATIONS": {
        word: "ASSOCIATIONS",
        definition: "Groups of people organized for a joint purpose; mental connections"
    },
    "SUPPLEMENTAL": {
        word: "SUPPLEMENTAL",
        definition: "Provided in addition to what already exists; extra"
    },
    "COORDINATION": {
        word: "COORDINATION",
        definition: "The organization of different elements to enable them to work together"
    },
    "CONTEMPORARY": {
        word: "CONTEMPORARY",
        definition: "Belonging to or occurring in the present; modern"
    },
    "IMPLEMENTING": {
        word: "IMPLEMENTING",
        definition: "Putting a decision or plan into effect; executing"
    },
    "HEADQUARTERS": {
        word: "HEADQUARTERS",
        definition: "The main offices or center of operations of an organization"
    },
    "SIGNIFICANCE": {
        word: "SIGNIFICANCE",
        definition: "The quality of being worthy of attention; importance or meaning"
    },
    "COMMISSIONER": {
        word: "COMMISSIONER",
        definition: "A person appointed to a role with administrative authority"
    },
    "INDIVIDUALLY": {
        word: "INDIVIDUALLY",
        definition: "One by one; separately; as individuals"
    },
    "MANUFACTURED": {
        word: "MANUFACTURED",
        definition: "Made or produced in a factory; fabricated"
    },
    "OPTIMIZATION": {
        word: "OPTIMIZATION",
        definition: "The action of making the best or most effective use of something"
    },
    "CORPORATIONS": {
        word: "CORPORATIONS",
        definition: "Large companies or groups of companies acting as single entities"
    },
    "CAPABILITIES": {
        word: "CAPABILITIES",
        definition: "The extent of someone's or something's ability; capacities"
    },
    "INDEPENDENCE": {
        word: "INDEPENDENCE",
        definition: "The state of being free from outside control; self-governance"
    },
    "RESTRICTIONS": {
        word: "RESTRICTIONS",
        definition: "Limitations or controls placed on something; constraints"
    },
    "ACCOMPLISHED": {
        word: "ACCOMPLISHED",
        definition: "Highly skilled; successfully completed or achieved"
    },
    "BIBLIOGRAPHY": {
        word: "BIBLIOGRAPHY",
        definition: "A list of sources used in preparing a work; study of books"
    },
    "ALTERNATIVELY": {
        word: "ALTERNATIVELY",
        definition: "As another option or possibility; instead"
    },
    "MISCELLANEOUS": {
        word: "MISCELLANEOUS",
        definition: "Consisting of various types or from various sources; diverse"
    },
    "AUTOMATICALLY": {
        word: "AUTOMATICALLY",
        definition: "Without conscious thought or direct human control; by itself"
    },
    "INTERMEDIATE": {
        word: "INTERMEDIATE",
        definition: "Coming between two things in time, place, or character; middle"
    },
    "CONCENTRATION": {
        word: "CONCENTRATION",
        definition: "The action of focusing all attention; a close gathering of things"
    },
    "COMMUNICATING": {
        word: "COMMUNICATING",
        definition: "Sharing or exchanging information, news, or ideas"
    },
    "SUBSTANTIALLY": {
        word: "SUBSTANTIALLY",
        definition: "To a great or significant extent; considerably"
    },
    "COLLABORATION": {
        word: "COLLABORATION",
        definition: "The action of working with someone to produce or create something"
    },
    "CORRESPONDING": {
        word: "CORRESPONDING",
        definition: "Having a close similarity; matching; related to"
    },
    "REVOLUTIONARY": {
        word: "REVOLUTIONARY",
        definition: "Involving or causing a complete or dramatic change; radically new"
    },
    "ESTABLISHMENT": {
        word: "ESTABLISHMENT",
        definition: "The action of establishing something; a business or organization"
    },
    "PARLIAMENTARY": {
        word: "PARLIAMENTARY",
        definition: "Relating to or enacted by a parliament; following formal debate rules"
    },
    "CONSULTATIONS": {
        word: "CONSULTATIONS",
        definition: "Meetings with experts or professionals to seek advice"
    },
    "DOCUMENTATION": {
        word: "DOCUMENTATION",
        definition: "Material that provides official information or evidence; written specifications"
    },
    "INVESTIGATING": {
        word: "INVESTIGATING",
        definition: "Carrying out systematic inquiry or examination; researching"
    },
    "ESTABLISHMENTS": {
        word: "ESTABLISHMENTS",
        definition: "Places of business or residence; institutions"
    },
    "TRADITIONALLY": {
        word: "TRADITIONALLY",
        definition: "In a way that follows tradition; customarily"
    },
    "MODIFICATIONS": {
        word: "MODIFICATIONS",
        definition: "Changes made to something; alterations or adjustments"
    },
    "ENTERTAINMENT": {
        word: "ENTERTAINMENT",
        definition: "The action of providing amusement or enjoyment; shows or performances"
    },
    "ANNOUNCEMENTS": {
        word: "ANNOUNCEMENTS",
        definition: "Public and formal statements; declarations or notices"
    },
    "UNFORTUNATELY": {
        word: "UNFORTUNATELY",
        definition: "Used to say that something is sad, disappointing, or has a bad effect"
    },
    "CHARACTERIZED": {
        word: "CHARACTERIZED",
        definition: "Described the distinctive qualities of; typical of"
    },
    "DETERMINATION": {
        word: "DETERMINATION",
        definition: "Firmness of purpose; the process of establishing something exactly"
    },
    "COMPATIBILITY": {
        word: "COMPATIBILITY",
        definition: "The ability to exist or work together without conflict"
    },
    "ADMINISTRATOR": {
        word: "ADMINISTRATOR",
        definition: "A person responsible for managing an organization or system"
    },
    "OPPORTUNITIES": {
        word: "OPPORTUNITIES",
        definition: "Sets of circumstances making it possible to do something; chances"
    },
    "CONTRIBUTIONS": {
        word: "CONTRIBUTIONS",
        definition: "Gifts or payments to a common fund; parts played in achieving something"
    },
    "AUTOMATICALLY": {
        word: "AUTOMATICALLY",
        definition: "By itself with little or no direct human control"
    },
    "PHOTOGRAPHERS": {
        word: "PHOTOGRAPHERS",
        definition: "People who take photographs as a profession or hobby"
    },
    "ORGANIZATIONS": {
        word: "ORGANIZATIONS",
        definition: "Organized groups of people with particular purposes"
    },
    "FUNCTIONALITY": {
        word: "FUNCTIONALITY",
        definition: "The quality of being functional; the range of operations that can be performed"
    },
    "COMPREHENSIVE": {
        word: "COMPREHENSIVE",
        definition: "Complete and including everything that is necessary; thorough"
    },
    "CONTRIBUTIONS": {
        word: "CONTRIBUTIONS",
        definition: "Things given to help achieve or provide something; donations"
    },
    "MANUFACTURING": {
        word: "MANUFACTURING",
        definition: "The making of goods or articles on a large scale using machinery"
    },
    "ADMINISTRATOR": {
        word: "ADMINISTRATOR",
        definition: "A person who manages or has administrative control"
    },
    "CONSIDERATION": {
        word: "CONSIDERATION",
        definition: "Careful thought; a fact taken into account when making a decision"
    },
    "PROFESSIONALS": {
        word: "PROFESSIONALS",
        definition: "People engaged in a specified activity as their main paid occupation"
    },
    "UNDERSTANDING": {
        word: "UNDERSTANDING",
        definition: "The ability to comprehend; sympathetic awareness or tolerance"
    },
    "APPRECIATION": {
        word: "APPRECIATION",
        definition: "Recognition of the good qualities of something; gratitude"
    },
    "ENTREPRENEURS": {
        word: "ENTREPRENEURS",
        definition: "People who start and run business enterprises, taking on financial risks"
    },
    "REFRIGERATOR": {
        word: "REFRIGERATOR",
        definition: "An appliance for keeping food and drinks cold and fresh"
    },
    "CONTINUOUSLY": {
        word: "CONTINUOUSLY",
        definition: "Without interruption or cessation; constantly"
    },
    "CONSEQUENCES": {
        word: "CONSEQUENCES",
        definition: "Results or effects of actions or conditions"
    },
    "BIODIVERSITY": {
        word: "BIODIVERSITY",
        definition: "The variety of plant and animal life in a particular habitat"
    },
    "CONSTITUENTS": {
        word: "CONSTITUENTS",
        definition: "Parts of a whole; people represented by an elected official"
    },
    "CANCELLATION": {
        word: "CANCELLATION",
        definition: "The action of canceling something; annulment"
    },
    "PHOTOGRAPHER": {
        word: "PHOTOGRAPHER",
        definition: "A person who takes photographs as an occupation"
    },
    "CONSISTENTLY": {
        word: "CONSISTENTLY",
        definition: "In every case or on every occasion; invariably"
    },
    "OCCUPATIONAL": {
        word: "OCCUPATIONAL",
        definition: "Relating to a job or profession"
    },
    "SUBSCRIPTION": {
        word: "SUBSCRIPTION",
        definition: "Payment for regular receipt of a publication or service"
    },
    "CONDITIONING": {
        word: "CONDITIONING",
        definition: "Training to behave in a certain way; bringing to a desired state"
    },
    "QUESTIONABLE": {
        word: "QUESTIONABLE",
        definition: "Doubtful as regards truth or quality; not clearly honest"
    },
    "MATHEMATICAL": {
        word: "MATHEMATICAL",
        definition: "Relating to mathematics; rigorously precise"
    },
    "CIVILIZATION": {
        word: "CIVILIZATION",
        definition: "An advanced stage of human social development and organization"
    },
    "ACCOMPANYING": {
        word: "ACCOMPANYING",
        definition: "Going along with; providing musical support"
    },
    "COMBINATIONS": {
        word: "COMBINATIONS",
        definition: "Results of combining; sets of things chosen from a larger group"
    },
    "CONSEQUENCES": {
        word: "CONSEQUENCES",
        definition: "Results following from an action or condition"
    },
    "ESTABLISHING": {
        word: "ESTABLISHING",
        definition: "Setting up on a firm or permanent basis; proving"
    },
    "GEOGRAPHICAL": {
        word: "GEOGRAPHICAL",
        definition: "Relating to geography; based on or derived from physical features"
    },
    "CONSERVATION": {
        word: "CONSERVATION",
        definition: "Prevention of wasteful use of resources; preservation"
    },
    "CONVENTIONAL": {
        word: "CONVENTIONAL",
        definition: "Based on or following accepted standards; ordinary"
    },
    "IMPLICATIONS": {
        word: "IMPLICATIONS",
        definition: "Likely consequences; things implied but not stated"
    },
    "INTRODUCTION": {
        word: "INTRODUCTION",
        definition: "The bringing of something into use for the first time; opening section"
    },
    "MANUFACTURED": {
        word: "MANUFACTURED",
        definition: "Made on a large scale using machinery; invented or fabricated"
    },
    "CONFIDENTIAL": {
        word: "CONFIDENTIAL",
        definition: "Intended to be kept secret; entrusted with private information"
    },
    "DIFFICULTIES": {
        word: "DIFFICULTIES",
        definition: "Problems or situations that are hard to deal with"
    },
    "DEPARTMENTAL": {
        word: "DEPARTMENTAL",
        definition: "Relating to a department of an organization"
    },
    "DISPLACEMENT": {
        word: "DISPLACEMENT",
        definition: "The moving of something from its place; volume moved by an object"
    },
    "ACCOMPLISHED": {
        word: "ACCOMPLISHED",
        definition: "Highly trained or skilled; successfully completed"
    },
    "INSTRUMENTAL": {
        word: "INSTRUMENTAL",
        definition: "Serving as a means of pursuing an aim; relating to musical instruments"
    },
    "ARCHITECTURE": {
        word: "ARCHITECTURE",
        definition: "The art of designing buildings; the structure of something"
    },
    "CONSULTATION": {
        word: "CONSULTATION",
        definition: "A meeting to discuss or get advice; the act of consulting"
    },
    "CONSTRUCTION": {
        word: "CONSTRUCTION",
        definition: "The building of large structures; interpretation"
    },
    "SPECIFICALLY": {
        word: "SPECIFICALLY",
        definition: "In a way that is exact and clear; particularly"
    },
    "EXPECTATIONS": {
        word: "EXPECTATIONS",
        definition: "Beliefs that something will happen; standards to be met"
    },
    "COMMISSIONERS": {
        word: "COMMISSIONERS",
        definition: "People with official authority in particular areas"
    },
    "PROSTITUTION": {
        word: "PROSTITUTION",
        definition: "The practice of engaging in sexual activity for payment"
    },
    "COMBINATIONS": {
        word: "COMBINATIONS",
        definition: "Arrangements of different elements together; mathematical selections"
    },
    "VOLUNTERRING": {
        word: "VOLUNTERRING",
        definition: "Offering to do something without being forced or paid"
    },
    "COMPILATIONS": {
        word: "COMPILATIONS",
        definition: "Collections of things, especially pieces of music or writing"
    },
    "INTELLECTUAL": {
        word: "INTELLECTUAL",
        definition: "Relating to the intellect; requiring use of the mind"
    },
    "ACKNOWLEDGED": {
        word: "ACKNOWLEDGED",
        definition: "Recognized as being true or existing; expressed gratitude for"
    },
    "BREAKTHROUGH": {
        word: "BREAKTHROUGH",
        definition: "A sudden, dramatic, and important discovery or development"
    },
    "SCHOLARSHIPS": {
        word: "SCHOLARSHIPS",
        definition: "Grants to support a student's education, awarded on various criteria"
    },
    "SURVEILLANCE": {
        word: "SURVEILLANCE",
        definition: "Close observation, especially of a suspected person"
    },
    "KINDERGARTEN": {
        word: "KINDERGARTEN",
        definition: "A preschool educational approach for young children"
    },
    "MANUFACTURED": {
        word: "MANUFACTURED",
        definition: "Produced on a large scale using machinery"
    },
    "DESCRIPTIONS": {
        word: "DESCRIPTIONS",
        definition: "Detailed accounts of characteristics or features"
    }
,
    "CONVERSATION": {
        word: "CONVERSATION",
        definition: "A talk between two or more people in which thoughts, feelings, and ideas are expressed"
    }
};

// Export for use in the game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KEYSTONE_WORDS;
}

// Also make it available globally for browser use
if (typeof window !== 'undefined') {
    window.KEYSTONE_WORDS = KEYSTONE_WORDS;
    window.SEED_WORDS = KEYSTONE_WORDS; // Alias for compatibility
}
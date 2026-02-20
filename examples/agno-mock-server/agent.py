"""
Mock Agent with Generative UI Tools

This example demonstrates all the generative UI capabilities:
- Revenue charts (bar/line)
- Rental car cards
- Product comparison tables
- Dashboard metrics
- Smart data visualization
- Knowledge base with vector search
"""

from agno.agent import Agent
from agno.tools import tool
from agno.models.openai import OpenAIChat
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.embedder.openai import OpenAIEmbedder
from agno.vectordb.lancedb import LanceDb, SearchType
from typing import TypedDict
from agno.tools.reasoning import ReasoningTools


# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

class RevenueData(TypedDict):
    month: str
    revenue: float
    expenses: float

class CarData(TypedDict):
    id: str
    name: str
    description: str
    price_per_day: float
    type: str
    seats: int
    image_url: str
    available: bool

class ProductData(TypedDict):
    name: str
    price: float
    cpu: str
    ram: str
    storage: str
    display: str
    rating: float

class DashboardMetrics(TypedDict):
    totalSales: float
    newCustomers: int
    activeProjects: int
    salesTrend: str
    customerTrend: str
    projectStatus: str

# ============================================================================
# BACKEND DATA FETCHING TOOLS (execute on backend)
# ============================================================================

@tool
def get_revenue_data(period: str = "monthly") -> list[RevenueData]:
    """
    Fetch revenue data from the database.

    Args:
        period: The time period ("monthly", "quarterly", "yearly")

    Returns:
        List of revenue data with month, revenue, and expenses
    """
    if period == "quarterly":
        return [
            {"month": "Q1", "revenue": 18000, "expenses": 10500},
            {"month": "Q2", "revenue": 21000, "expenses": 12000},
            {"month": "Q3", "revenue": 24000, "expenses": 13500},
            {"month": "Q4", "revenue": 27000, "expenses": 15000},
        ]

    return [
        {"month": "Jan", "revenue": 5000, "expenses": 3000},
        {"month": "Feb", "revenue": 6000, "expenses": 3500},
        {"month": "Mar", "revenue": 7000, "expenses": 4000},
        {"month": "Apr", "revenue": 7500, "expenses": 4200},
        {"month": "May", "revenue": 8000, "expenses": 4500},
        {"month": "Jun", "revenue": 8500, "expenses": 4800},
    ]

@tool
def get_rental_cars(location: str = "San Francisco") -> list[CarData]:
    """
    Fetch available rental cars from the database.

    Args:
        location: City or location for car search

    Returns:
        List of available rental cars with details
    """
    return [
        {
            "id": "car-1",
            "name": "Tesla Model 3",
            "description": "Electric sedan with autopilot and premium interior",
            "price_per_day": 120,
            "type": "Electric",
            "seats": 5,
            "image_url": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400",
            "available": True,
        },
        {
            "id": "car-2",
            "name": "BMW X5",
            "description": "Luxury SUV with advanced safety features",
            "price_per_day": 150,
            "type": "SUV",
            "seats": 7,
            "image_url": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400",
            "available": True,
        },
        {
            "id": "car-3",
            "name": "Honda Civic",
            "description": "Reliable and fuel-efficient compact car",
            "price_per_day": 45,
            "type": "Compact",
            "seats": 5,
            "image_url": "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400",
            "available": True,
        },
        {
            "id": "car-4",
            "name": "Ford Mustang",
            "description": "Iconic sports car with powerful performance",
            "price_per_day": 95,
            "type": "Sports",
            "seats": 4,
            "image_url": "https://images.unsplash.com/photo-1584345604476-8ec5f8f2c8c2?w=400",
            "available": False,
        },
    ]

@tool
def get_laptop_comparison(category: str = "laptops") -> list[ProductData]:
    """
    Fetch product comparison data from the database.

    Args:
        category: Product category to compare

    Returns:
        List of products with specifications
    """
    return [
        {
            "name": "MacBook Pro 16\"",
            "price": 2499,
            "cpu": "M3 Max",
            "ram": "32GB",
            "storage": "1TB SSD",
            "display": "16.2\" Retina",
            "rating": 4.8,
        },
        {
            "name": "Dell XPS 15",
            "price": 1899,
            "cpu": "Intel i9",
            "ram": "32GB",
            "storage": "1TB SSD",
            "display": "15.6\" OLED",
            "rating": 4.6,
        },
        {
            "name": "Lenovo ThinkPad X1",
            "price": 1699,
            "cpu": "Intel i7",
            "ram": "16GB",
            "storage": "512GB SSD",
            "display": "14\" IPS",
            "rating": 4.5,
        },
        {
            "name": "ASUS ROG Zephyrus",
            "price": 2199,
            "cpu": "AMD Ryzen 9",
            "ram": "32GB",
            "storage": "1TB SSD",
            "display": "15.6\" QHD",
            "rating": 4.7,
        },
    ]

@tool
def get_dashboard_metrics(userId: str = "user123") -> DashboardMetrics:
    """
    Fetch dashboard metrics from analytics database.

    Args:
        userId: User ID for personalized metrics

    Returns:
        Dictionary with dashboard metrics
    """
    return {
        "totalSales": 125000,
        "newCustomers": 234,
        "activeProjects": 12,
        "salesTrend": "+12.5%",
        "customerTrend": "+8.3%",
        "projectStatus": "On Track",
    }

@tool
def get_market_share_data() -> list[dict]:
    """
    Fetch market share data for visualization.

    Returns:
        List of market share data by company
    """
    return [
        {"company": "Company A", "share": 35},
        {"company": "Company B", "share": 28},
        {"company": "Company C", "share": 22},
        {"company": "Company D", "share": 15},
    ]

# ============================================================================
# FRONTEND RENDERING TOOLS (execute on frontend)
# ============================================================================

@tool(external_execution=True)
def render_revenue_chart(
    data: list[RevenueData],
    period: str = "monthly",
    chartType: str = "auto"
):
    """
    Render a revenue chart on the frontend.

    Args:
        data: Revenue data to render (fetched from get_revenue_data)
        period: Time period for the chart
        chartType: Chart type ("auto", "line", "bar", "trend")
    """
    pass

@tool(external_execution=True)
def render_rental_cars(data: list[CarData], location: str = "San Francisco"):
    """
    Render rental cars as an interactive card grid on the frontend.

    Args:
        data: Car data to render (fetched from get_rental_cars)
        location: Location where cars are available
    """
    pass

@tool(external_execution=True)
def render_product_comparison(data: list[ProductData], category: str = "products"):
    """
    Render product comparison table on the frontend.

    Args:
        data: Product data to render (fetched from get_laptop_comparison)
        category: Product category being compared
    """
    pass

@tool(external_execution=True)
def render_dashboard(data: DashboardMetrics, userId: str = None):
    """
    Render a dashboard with key metrics on the frontend.

    Args:
        data: Dashboard metrics to render (fetched from get_dashboard_metrics)
        userId: Optional user ID for personalization
    """
    pass

@tool(external_execution=True)
def render_visualization(data: list[dict], query: str = "Data", chartType: str = None):
    """
    Render data visualization with smart chart type detection on the frontend.

    Args:
        data: Data to visualize
        query: Description of what's being visualized
        chartType: Optional chart type hint ("pie", "line", "bar")
    """
    pass

@tool(external_execution=True)
def show_alert(content: str):
    """
    Show an alert message on the frontend.

    Args:
        content: The alert message to display
    """
    pass

# ============================================================================
# KNOWLEDGE BASE CONFIGURATION
# ============================================================================

def create_knowledge_base(contents_db=None):
    """Create and return the knowledge base with LanceDB vector store.
    
    Args:
        contents_db: Optional database for storing knowledge contents.
                     Should have an explicit ID for the AgentOS knowledge API.
    """
    knowledge = Knowledge(
        vector_db=LanceDb(
            uri="tmp/lancedb",
            table_name="demo_knowledge",
            search_type=SearchType.hybrid,
            embedder=OpenAIEmbedder(id="text-embedding-3-small"),
        ),
        contents_db=contents_db,
    )
    return knowledge

# ============================================================================
# AGENT CONFIGURATION
# ============================================================================

def create_agent(db, knowledge=None):
    """Create and return the generative UI demo agent.
    
    Args:
        db: Database for sessions and other agent data.
        knowledge: Optional knowledge base to attach to the agent.
    """
    return Agent(
        name="generative-ui-demo",
        db=db,
        knowledge=knowledge,
        search_knowledge=True,
        tools=[
            # Backend data fetching tools
            get_revenue_data,
            get_rental_cars,
            get_laptop_comparison,
            get_dashboard_metrics,
            get_market_share_data,
            # Frontend rendering tools
            render_revenue_chart,
            render_rental_cars,
            render_product_comparison,
            render_dashboard,
            render_visualization,
            show_alert,
            # ReasoningTools(add_instructions=True)
        ],
        reasoning=True,
        
        
        model=OpenAIChat(id="gpt-4o-mini"),
        description="AI assistant that demonstrates generative UI capabilities with interactive charts, cards, tables, and visualizations.",
        instructions=[
            "You are a helpful AI assistant that creates beautiful, interactive visualizations.",
            "",
            "CRITICAL WORKFLOW:",
            "1. When user asks for data visualization, FIRST fetch the data using the appropriate get_* tool",
            "2. THEN pass that data to the appropriate render_* tool for frontend display",
            "",
            "Examples:",
            "- User: 'Show revenue' -> call get_revenue_data() -> call render_revenue_chart(data=result)",
            "- User: 'Show rental cars' -> call get_rental_cars() -> call render_rental_cars(data=result)",
            "- User: 'Compare laptops' -> call get_laptop_comparison() -> call render_product_comparison(data=result)",
            "- User: 'Show my dashboard' -> call get_dashboard_metrics() -> call render_dashboard(data=result)",
            "- User: 'Visualize market share' -> call get_market_share_data() -> call render_visualization(data=result, chartType='pie')",
            "",
            "The render_* tools execute on the FRONTEND and create interactive UI components.",
            "Always explain what you're showing and offer to adjust the visualization.",
            "",
            "You also have access to a knowledge base. When users ask about uploaded documents,",
            "search the knowledge base to find relevant information.",
            # "IMPORTANT: ALWAYS USE YOUR REASONING TOOLS BEFORE ANSWERING",
        ],
        add_history_to_context=True,
        markdown=True,
        debug_mode=True,
        debug_level=2,
    )

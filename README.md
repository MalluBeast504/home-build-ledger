# Home Build Ledger

A comprehensive expense tracking application designed for home construction and renovation projects. Built with React, TypeScript, and Supabase, this app helps you monitor, categorize, and analyze expenses throughout your home building journey.

## Features

- **Expense Tracking**: Add, edit, and delete expenses with detailed information
- **Vendor Management**: Track contractors, suppliers, engineers, and labor
- **Category Management**: Use predefined categories or create custom ones
- **Interactive Charts**: Visualize spending trends and expense distribution
- **Advanced Filtering**: Filter expenses by category, vendor, amount, date, and search terms
- **Export Functionality**: Export expense reports to PDF with preview
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant data synchronization across devices
- **Authentication**: Secure user authentication with Supabase Auth

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI primitives
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **Charts**: Recharts
- **State Management**: TanStack Query
- **Routing**: React Router
- **PDF Generation**: jsPDF, jsPDF-autotable
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mallubeast504/home-build-ledger.git
cd home-build-ledger
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL setup script (see `supabase/setup.sql`)
   - Copy your Supabase URL and anon key

4. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

5. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses the following main tables:

### expenses
- `id`: UUID (Primary Key)
- `amount`: Numeric
- `category`: String
- `date`: Date
- `description`: Text (Optional)
- `vendor_id`: UUID (Foreign Key to vendors)
- `user_id`: UUID (Foreign Key to auth.users)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### vendors
- `id`: UUID (Primary Key)
- `name`: String
- `type`: String (engineer, contractor, supplier, labour)
- `user_id`: UUID (Foreign Key to auth.users)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### custom_categories
- `id`: UUID (Primary Key)
- `name`: String
- `user_id`: UUID (Foreign Key to auth.users)
- `created_at`: Timestamp

## Usage

### Adding Expenses
1. Click "New Expense" or use `Ctrl/Cmd + N`
2. Fill in amount, category, vendor, date, and description
3. Click "Add Expense"

### Managing Vendors
- Select existing vendors from the dropdown
- Click the "+" button to add new vendors
- Vendors are categorized by type (engineer, contractor, supplier, labour)

### Custom Categories
- Use predefined categories or create custom ones
- Click the "+" next to the category dropdown to add new categories

### Filtering and Search
- Use the filter bar to narrow down expenses
- Search across descriptions, categories, and vendor names
- Use `Ctrl/Cmd + K` for quick search with suggestions

### Exporting Data
1. Apply desired filters
2. Click "Export to PDF"
3. Preview and download the generated report

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Open search dialog
- `Ctrl/Cmd + N`: Add new expense
- `Escape`: Close dialogs and modals

## Deployment

The application is configured for GitHub Pages deployment:

```bash
npm run build
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Open an issue on GitHub
- Check the [documentation](https://supabase.com/docs)
- Review the [React documentation](https://react.dev)

---

Built with ❤️ for home builders and renovators.
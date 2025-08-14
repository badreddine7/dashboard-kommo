import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  Search, 
  ArrowLeft, 
  AlertTriangle, 
  BarChart3, 
  CreditCard,
  Users
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    navigate("/");
  };

  const handleGoToPricing = () => {
    navigate("/pricing");
  };

  const handleGoToBilling = () => {
    navigate("/billing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Sorry, we couldn't find the page you're looking for.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Requested URL:</strong>
              </p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded text-red-600 font-mono">
                {location.pathname}
              </code>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={handleGoBack}
                  variant="outline" 
                  className="h-12 justify-start"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                
                <Button 
                  onClick={handleGoHome}
                  className="h-12 justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </div>

              {isAuthenticated && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                  <Button 
                    onClick={handleGoToDashboard}
                    variant="outline" 
                    size="sm"
                    className="h-10 justify-start"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  
                  <Button 
                    onClick={handleGoToPricing}
                    variant="outline" 
                    size="sm"
                    className="h-10 justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Pricing
                  </Button>
                  
                  <Button 
                    onClick={handleGoToBilling}
                    variant="outline" 
                    size="sm"
                    className="h-10 justify-start"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing
                  </Button>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Check if the URL is spelled correctly</p>
                <p>• Try refreshing the page</p>
                <p>• Contact support if the problem persists</p>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Still having trouble?</strong> Contact our support team at{" "}
                <a 
                  href="mailto:support@kommopulse.com" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  support@kommopulse.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;

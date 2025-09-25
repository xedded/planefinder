// Test script to call the API directly and see what it returns

async function testAPI() {
  try {
    console.log('Testing API with test coordinates...');
    const response = await fetch('https://planefinder-hsxkgdb0g-xeddeds-projects.vercel.app/api/aircraft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 59.3293,  // Stockholm coordinates
        longitude: 18.0686
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      console.log('Response not OK, status:', response.status);
      const errorText = await response.text();
      console.log('Error text:', errorText);
      return;
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    console.log('Aircraft count:', data.aircraft ? data.aircraft.length : 0);
    console.log('Is real data:', data.isRealData);

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();
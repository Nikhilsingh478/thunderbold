package shop.thunderbold.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "thunderbold_orders",
                "Order Updates",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for order status updates");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 200, 100, 200});
            channel.enableLights(true);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
